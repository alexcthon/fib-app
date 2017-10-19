const test = require('test');
test.setup();

const http = require('http');
const util = require('util');

function clen_result(res) {
    if (util.isObject(res)) {
        if (Array.isArray(res))
            res.forEach(r => clen_result(r));
        else {
            delete res.createAt;
            delete res.updateAt;
            delete res.ACL;
            for (var k in res)
                clen_result(res[k]);
        }
    }
}

function check_result(res, data) {
    clen_result(res);
    assert.deepEqual(res, data);
}

describe("relation", () => {
    it('init data', () => {
        var rep = http.post('http://127.0.0.1:8080/1.0/app/people', {
            json: [{
                name: 'tom',
                sex: "male",
                age: 35
            }, {
                name: 'alice',
                sex: "famale",
                age: 32
            }, {
                name: 'jack',
                sex: "male",
                age: 8
            }, {
                name: 'lily',
                sex: "famale",
                age: 4
            }]
        });

        check_result(rep.json(), [{
                "id": 1
            },
            {
                "id": 2
            },
            {
                "id": 3
            },
            {
                "id": 4
            }
        ]);
    });

    it('init relation', () => {
        var rep = http.put('http://127.0.0.1:8080/1.0/app/people/1/wife/2');
        assert.equal(rep.statusCode, 200)

        var rep = http.get('http://127.0.0.1:8080/1.0/app/people/1', {
            query: {
                keys: 'wife_id'
            }
        });
        check_result(rep.json(), {
            wife_id: 2
        });

        var rep = http.put('http://127.0.0.1:8080/1.0/app/people/2/husband/1');
        assert.equal(rep.statusCode, 200)

        function set_parents(id) {
            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/father/1`);
            assert.equal(rep.statusCode, 200)

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/mother/2`);
            assert.equal(rep.statusCode, 200)
        }

        set_parents(3);
        set_parents(4);

        function add_childs(id) {
            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/childs/3`);
            assert.equal(rep.statusCode, 200)

            var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/${id}/childs/4`);
            assert.equal(rep.statusCode, 200)
        }

        add_childs(1);
        add_childs(2);
    });

    it('get relation', () => {
        var rep = http.get('http://127.0.0.1:8080/1.0/app/people/1/wife', {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get('http://127.0.0.1:8080/1.0/app/people/3/mother', {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), {
            "name": "alice",
            "age": 32
        });

        var rep = http.get('http://127.0.0.1:8080/1.0/app/people/1/childs', {
            query: {
                keys: 'name,age',
                order: 'age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }, {
            "name": "jack",
            "age": 8
        }]);
    });

    it('delete relation', () => {
        var rep = http.del('http://127.0.0.1:8080/1.0/app/people/1/wife');
        assert.equal(rep.statusCode, 200);

        var rep = http.get('http://127.0.0.1:8080/1.0/app/people/1/wife', {
            query: {
                keys: 'name,age'
            }
        });
        assert.equal(rep.statusCode, 101);

        var rep = http.del('http://127.0.0.1:8080/1.0/app/people/1/childs/3');
        assert.equal(rep.statusCode, 200);

        var rep = http.get('http://127.0.0.1:8080/1.0/app/people/1/childs', {
            query: {
                keys: 'name,age'
            }
        });
        check_result(rep.json(), [{
            "name": "lily",
            "age": 4
        }]);

        var rep = http.put(`http://127.0.0.1:8080/1.0/app/people/1/childs/3`);
        assert.equal(rep.statusCode, 200)
    });
});