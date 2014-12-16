var fs = require('../index.js');
var path = require('path');

var assert = require('chai').assert;

describe('when accessing traditionnal file', function() {
	it('can stat a folder', function(done) {
		fs.stat(path.join(__dirname, 'fixtures'), function(err, stat) {
			assert.equal(err, null);
			assert.equal(stat.isDirectory(), true);
			assert.notEqual(stat.isFile(), true);

			done();
		});
	});

	it('can stat a file', function(done) {
		fs.stat(path.join(__dirname, 'fixtures', 'name.txt'), function(err, stat) {
			assert.equal(err, null);
			assert.notEqual(stat.isDirectory(), true);
			assert.equal(stat.isFile(), true);

			done();
		});
	});


	it('can read a file with readStream', function(done) {
		fs.createReadStream(path.join(__dirname, 'fixtures', 'name.txt')).on('data', function(data) {
			assert.equal(data.toString(), 'tobi');
			done();
		});
	});


	it('can stat a zip file', function(done) {
		fs.stat(path.join(__dirname, 'fixtures', 'fixtures.zip'), function(err, stat) {
			assert.equal(err, null);
			assert.notEqual(stat.isDirectory(), true);
			assert.equal(stat.isFile(), true);
			assert.equal(stat.size, 1609);

			done();
		});
	});


})


describe('when accessing insize a zip file', function() {

	var __zipname = path.join(__dirname, 'fixtures', 'fixtures.zip');
	it('can stat a folder', function(done) {
		fs.stat(path.join(__zipname, 'pets'), function(err, stat) {
			assert.equal(err, null);
			assert.equal(stat.isDirectory(), true);
			assert.notEqual(stat.isFile(), true);

			done();
		});
	});

	it('can stat a file', function(done) {
		fs.stat(path.join(__zipname, 'tobi.html'), function(err, stat) {
			assert.equal(err, null);
			assert.notEqual(stat.isDirectory(), true);
			assert.equal(stat.isFile(), true);
			done();
		});
	});


	it('can read a file with readStream', function(done) {
		fs.createReadStream(path.join(__zipname, 'name.txt')).on('data', function(data) {
			assert.equal(data.toString(), 'tobi');
			done();
		});
	});


	it('can stat a zip file', function(done) {
		fs.stat(path.join(__dirname, 'fixtures', 'container.zip', 'folder', 'fixtures.zip'), function(err, stat) {
			assert.equal(err, null);
			assert.notEqual(stat.isDirectory(), true);
			assert.equal(stat.isFile(), true);
			assert.equal(stat.size, 1609);
			done();
		});
	});

	it('can stat a file in a zip file', function(done) {
		fs.stat(path.join(__dirname, 'fixtures', 'container.zip', 'folder', 'fixtures.zip', 'tobi.html'), function(err, stat) {
			assert.equal(err, null);
			assert.notEqual(stat.isDirectory(), true);
			assert.equal(stat.isFile(), true);

			done();
		});
	});


	it('can read a file in a zip file', function(done) {
		fs.createReadStream(path.join(__dirname, 'fixtures', 'container.zip', 'folder', 'fixtures.zip', 'tobi.html')).on('data', function(data) {
			assert.equal(data.toString(), '<p>tobi</p>');

			done();
		});
	});

})