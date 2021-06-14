const user = require('./user');

test('check user 1 is firstname max', () => {
    // user firstname with userId 1 is max
    return user.fetchUser(1).then(data => {
        expect(data.data.data.firstname).toBe('max')
    });
});

test('check user 2 is not firstname test2', () => {
    // user firstname with userId 2 is test
    return user.fetchUser(2).then(data => {
        expect(data.data.data.firstname).not.toBe('test2')
    });
});

test('user 1 is admin', () => {
    return user.fetchUser(1).then(data => {
        expect(data.data.data.isAdmin).toBeTruthy()
    });
});

test('user 2 is not admin', () => {
    return user.fetchUser(2).then(data => {
        expect(data.data.data.isAdmin).toBe(false)
    });
});
