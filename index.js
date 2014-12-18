var fs = require('fs');
var path = require('path');
var unzip = require('unzip-maxired');
var util = require('util');


var FSEntry = function(){

}
FSEntry.prototype.mtime = new Date();
FSEntry.prototype.atime = new Date();
FSEntry.prototype.ctime = new Date();
FSEntry.prototype.ino = 0;

var Directory = function(entry) {
	FSEntry.call(this);
	this.size = entry.size;
};
util.inherits(Directory, FSEntry);

Directory.prototype.isDirectory = function() {
	return true;
};

Directory.prototype.isFile = function() {
	return false;
};

var File = function(entry) {
	FSEntry.call(this);
	this.size = entry.size;
	this.entry = entry;
	this.pipe = entry.pipe.bind(entry);
};
util.inherits(File, FSEntry);

File.prototype.isDirectory = function() {
	return false;
};

File.prototype.isFile = function() {
	return true;
};

//findRootzip
//then recurssive fct

// this function is a recurecvie function ot find the ROOT zip
// it is not used in other case
var _findRootZip = function(tree, cb) {
	tree.inzip = tree.inzip || '';
	if (path.dirname(tree.path).length == 1) {
		return cb({
			code: 'ENOTDIR',
		});
	};

	fs.stat(tree.path, function(err, stat) {
		if (err && err.code === 'ENOTDIR') {
			return _findRootZip({
				path: path.dirname(tree.path),
				inzip: path.join(path.basename(tree.path), tree.inzip)
			}, cb);
		} else if (err) {
			//not sur what happend 
			return cb(err);
		};

		if (stat.isFile()) {
			//we math a file
			cb(null, tree);
		}else{
			// probably the origin path was zip with trailing /
			cb({code: 'ENOTDIR' });
		}
	})

};


var _findEntryInZip = function(fileStream, tree, cb) {

	var found = false;
	var longerMatch = '';
	var longerMatchEntry;
	fileStream.pipe(unzip.Parse()).on('entry', function(entry) {
		if (found) {
			entry.autodrain();
			return;
		}
		var fileName = entry.path;
		var type = entry.type; // 'Directory' or 'File'
		var size = entry.size;

		if (type == 'File' && fileName === tree.inzip) {
			found = true;
			return cb(null, entry);
		} else if (fileName.indexOf(tree.inzip + path.sep) == 0) {
			//we are looking for a directory and there is a file or a directory matching it
			found = true;
			if (fileName.length > tree.inzip.length) {
				// createFakeEntry for Directory
				return cb(null, {
					type: 'Directory'
				});
			} else {
				// exact directory
				return cb(null, entry);
			}

		} else {

			var fullPath = tree.inzip + path.sep;
			if (fullPath.indexOf(fileName) == 0) {
				if (fileName.length > longerMatch.length) {
					longerMatch = fileName;
					longerMatchEntry = entry;
				}
			} else {
				entry.autodrain();
			}
		}

	}).on('close', function() {

		if (!found) {

			if (longerMatch.length > 0) {
				var fullPath = tree.inzip;
				var nextInzip = fullPath.substr(longerMatch.length + 1);
				var nextTree = {
					path: path.dirname(tree.path),
					inzip: {
						path: longerMatch,
						inzip: nextInzip
					}
				}
				return _findEntryInZip(longerMatchEntry, {
					path: longerMatch,
					inzip: nextInzip
				}, cb);


			} else {
				cb({
					code: 'ENOENT',
					file: path.join(tree.path, tree.inzip)
				});
			}
		}

	}).on('error', function(err){
		if(err && err.message && err.message.indexOf("invalid signature:")==0){
			//we try to unzip something while is not a zip
			// it would have been handle somewhere else if it was a directory, so it is a file
			// whe shoudl throw ENOTDIR
			cb({code : "ENOTDIR", file : tree.path});
		}
		else{
			cb(err)
		}
	})
};

var _findEntry = function(path, cb) {
	_findRootZip({
		path: path
	}, function(err, tree) {
		if (err) {
			return cb(err)
		} else if (path.inzip === '') {
			cb(err, tree);
		} else {
			// we should start to look inside zip in there is what we want
			_findEntryInZip(fs.createReadStream(tree.path), tree, function(err, entry) {
				if (err) {
					return cb(err);
				}
				if (entry.type == "Directory") {
					return cb(err, new Directory(entry));
				} else if (entry.type == "File") {
					return cb(err, new File(entry));
				} else {
					return cb({
						code: 'EINVAL'
					});
				}
			});
		}
	});
};

var stat = function(path, cb) {
	fs.stat(path, function(err, _stat) {
		if (!err || err.code !== 'ENOTDIR') {
			return cb.apply(cb, arguments);
		} else {
			// we should check if we have a zip somewhere
			_findEntry(
				path,
				function(err, _stat) {
					cb(err, _stat);
				})
		}
	})

	//return fs.stat.apply(fs, arguments);
};


var RangedStream = require('ranged-stream');

var createReadStream = function(path, option) {
	var buffer;
	var toReturn = new RangedStream(option);

	fs.stat(path, function(err, _stat) {
		if (_stat) {
			return fs.createReadStream(path, option).pipe(toReturn);
		} else {
			return _findEntry(path, function(err, _stat) {
				if (!err) {
					_stat.pipe(toReturn);
				} else {
					toReturn.emit('error', err);
				}
			})
		}
	});
	toReturn.on('error', function(err) {
		console.log("####################I got an erro", err);
	})

	return toReturn;
}

module.exports = {
	stat: stat,
	createReadStream: createReadStream
}