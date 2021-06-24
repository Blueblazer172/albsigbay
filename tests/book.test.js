
const book = require('./book');
const user = require('./user')

test('check book 1 exists', () => {
    // user firstname with userId 1 is max
    return book.fetchBook(1).then(data => {
        expect(data.data.data).not.toEqual(null);

    });
});


test('check if a user with firstname has borrowed book with id 1', () => {
    // user firstname with userId 1 is max
    return book.fetchBook(1).then(data => {
        return user.fetchUser(data.data.data.borrowedBooks[0].userId).then(data => {
            expect(data.data.data.firstname).toBe('test2')
        });
    });
});