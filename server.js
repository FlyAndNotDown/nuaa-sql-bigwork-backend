const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const { dbConnectionInfo, adminPasswordHash } = require('./config');
const sha256 = require('js-sha256');

// 全局异常处理
process.on('uncaughtException', (err) => {
    console.log(err);
});

// 浏览器引用
let window;

// 本地服务器
let server = express();
server.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "http://localhost:3000");
    res.header("Access-Control-Allow-Headers", "Content-Type,Content-Length, Authorization, Accept,X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Credentials", "true");
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else next();
});
server.use(cookieParser());
server.use(session({
    secret: 'session',
    resave: true,
    saveUninitialized: true
}));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({extended: true}));
server.post('/request/user/login', (req, res) => {
    // 获取参数
    let args = req.body;
    // 先看看是不是管理员账户
    if (args.username === 'admin') {
        // 验证密码
        if (args.password === adminPasswordHash) {
            req.session.login = true;
            req.session.admin = true;
            req.session.username = 'admin';
            return res.json({
                success: true,
                admin: true
            });
        } else {
            return res.json({
                success: false
            });
        }
    } else {
        // 查找学生数据库中是否有匹配的学号，如果有则获取他的信息
        let connection = mysql.createConnection(dbConnectionInfo);
        let sql = 'select * from student where number = ? limit 1';
        connection.query(sql, [args.username], (err, result) => {
            if (err) {
                connection.end();
                return res.json({
                    success: false
                });
            }
            // 如果找到了
            if (result.length > 0) {
                // 获取他的手机号后 4 位
                phone = result[0].phone;
                password = phone[phone.length - 4];
                password += phone[phone.length - 3];
                password += phone[phone.length - 2];
                password += phone[phone.length - 1];
                // 使用sha256进行hash
                passwordHash = sha256(password);
                // 验证
                if (args.password === passwordHash) {
                    req.session.login = true;
                    req.session.admin = false;
                    req.session.userId = result[0].id;
                    req.session.username = result[0].name;
                    return res.json({
                        success: true,
                        admin: false,
                        userId: result[0].id
                    });
                } else {
                    return res.json({
                        success: false
                    });
                }
            } else {
                return res.json({
                    success: false
                });
            }
        });
    }
});
server.post('/request/user/getLoginInfo', (req, res) => {
    let login = req.session.login ? req.session.login : false;
    let admin =req.session.admin ? req.session.admin : false;
    let userId = req.session.userId ? req.session.userId : -1;
    let username = req.session.username ? req.session.username : '';
    return res.json({
        login: login,
        admin: admin,
        id: userId,
        username: username
    });
});
server.post('/request/student/getAll', (req, res) => {
    let connection = mysql.createConnection(dbConnectionInfo);
    connection.query('select * from student', (err, r) => {
        if (err) {
            connection.end();
            return res.json({
                success: false
            });
        }
        let result = [];
        r.map((item) => {
            result.push({
                key: item.id,
                id: item.id,
                number: item.number,
                name: item.name,
                college: item.college,
                major: item.major,
                sex: item.sex,
                grade: item.grade,
                phone: item.phone
            });
        });
        connection.end();
        return res.json({
            success: true,
            result: result
        });
    });
});
server.post('/request/student/get', (req, res) => {
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let sql = 'select * from student where id = ? limit 1';
    let params = [args.id];
    connection.query(sql, params, (err, t) => {
        if (err) {
            connection.end();
            return res.json({
                success: false
            });
        }
        connection.end();
        if (t.length > 0) {
            let r = {
                id: t[0].id,
                number: t[0].number,
                name: t[0].name,
                college: t[0].college,
                major: t[0].major,
                sex: t[0].sex,
                grade: t[0].grade,
                phone: t[0].phone
            };
            return res.json({
                success: true,
                result: r
            });
        } else {
            return res.json({
                success: false
            });
        }
    });
});
server.post('/request/student/add', (req, res) => {
    // 建立连接
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let sql = 'insert into student(number, name, college, major, sex, grade, phone) ' +
        'values(?, ?, ?, ?, ?, ?, ?)';
    let params = [];
    params.push(args.number);
    params.push(args.name);
    params.push(args.college);
    params.push(args.major);
    params.push(args.sex);
    params.push(args.grade);
    params.push(args.phone);
    connection.query(sql, params, (err) => {
        setTimeout(() => {
            if (err) {
                connection.end();
                return res.json({
                    success: false
                });
            }
            connection.end();
            return res.json({
                success: true
            });
        }, 1000);
    });
});
server.post('/request/student/delete', (req, res) => {
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let idList = '';
    args.ids.map((id, no) => {
        if (no === args.ids.length - 1)
            idList += id;
        else
            idList += `${id},`;
    });
    let sql = `delete from student where id in (${idList})`;
    connection.query(sql, (err) => {
        if (err) {
            connection.end();
            return res.json({
                success: false
            });
        }
        connection.end();
        return res.json({
            success: true
        });
    });
});
server.post('/request/student/modify', (req, res) => {
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let suc = true;
    let idList = '';
    args.ids.map((id, no) => {
        if (no === args.ids.length - 1)
            idList += id;
        else
            idList += `${id},`;
    });
    let sqls = [
        `update student set number = ? where id in (${idList})`,
        `update student set name = ? where id in (${idList})`,
        `update student set college = ? where id in (${idList})`,
        `update student set major = ? where id in (${idList})`,
        `update student set sex = ? where id in (${idList})`,
        `update student set grade = ? where id in (${idList})`,
        `update student set phone = ? where id in (${idList})`
    ];
    let params = [
        args.number === '' ? null : [args.number],
        args.name === '' ? null : [args.name],
        args.college === '' ? null : [args.college],
        args.major === '' ? null : [args.major],
        args.sex === '' ? null : [args.sex],
        args.grade === '' ? null : [args.grade],
        args.phone === '' ? null : [args.phone]
    ];
    for (let i = 0; i < 8; i++)
        if (params[i])
            connection.query(sqls[i], params[i], (err) => {
                if (err) suc = false;
            });

    connection.end();
    // 延迟一秒响应客户端，防止老师觉得我的数据库操作太快
    // 顺便使客户端发呆一会以表现出动画效果
    setTimeout(() => {
        res.json({
            success: suc
        });
    }, 1000);
});
server.post('/request/class/getAll', (req, res) => {
    let connection = mysql.createConnection(dbConnectionInfo);
    connection.query('select * from class', (err, t) => {
        if (err) {
            connection.end();
            return res.json({
                success: false
            });
        }
        connection.end();
        let result = [];
        t.map((item) => {
            result.push({
                key: item.id,
                id: item.id,
                name: item.name,
                teacher: item.teacher,
                grade: item.grade,
                plan: item.plan
            });
        });
        return res.json({
            success: true,
            result: result
        });
    });
});
server.post('/request/class/add', (req, res) => {
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let sql = 'insert into class(name, teacher, grade, plan) ' +
        'values(?, ?, ?, ?)';
    let params = [];
    params.push(args.name);
    params.push(args.teacher);
    params.push(args.grade);
    params.push(args.plan);
    connection.query(sql, params, (err) => {
        setTimeout(() => {
            if (err) {
                connection.end();
                return res.json({
                    success: false
                });
            }
            connection.end();
            return res.json({
                success: true
            });
        }, 1000);
    })
});
server.post('/request/class/delete', (req, res) => {
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let idList = '';
    args.ids.map((id, no) => {
        if (no === args.ids.length - 1)
            idList += id;
        else
            idList += `${id},`;
    });
    let sql = `delete from class where id in (${idList})`;
    connection.query(sql, (err) => {
        if (err) {
            connection.end();
            return res.json({
                success: false
            });
        }
        connection.end();
        return res.json({
            success: true
        });
    })
});
server.post('/request/class/modify', (req, res) => {
    let args = req.body;
    let connection = mysql.createConnection(dbConnectionInfo);
    let suc = true;
    let idList = '';
    args.ids.map((id, no) => {
        if (no === args.ids.length - 1)
            idList += id;
        else
            idList += `${id},`;
    });
    let sqls = [
        `update class set name = ? where id in (${idList})`,
        `update class set teacher = ? where id in (${idList})`
    ];
    let params = [
        args.name === '' ? null : [args.name],
        args.teacher === '' ? null : [args.teacher]
    ];
    for (let i = 0; i < 8; i++)
        if (params[i])
            connection.query(sqls[i], params[i], (err) => {
                if (err) suc = false;
            });
    setTimeout(() => {
        connection.end();
        res.json({
            success: suc
        });
    }, 1000);
});
server.post('/request/class/getSelected', (req, res) => {
    let id = req.session.userId;
    if (id) {
        let connection = mysql.createConnection(dbConnectionInfo);
        connection.query(`select * from \`select\` where student = ?`, [id], (err, selected) => {
            if (err) {
                return res.json({
                    success: false
                });
            } else {
                let success = true;
                let result = [];
                selected.map((rel) => {
                    connection.query(`select * from class where id = ? limit 1`, [rel.class], (err, t) => {
                        if (err) {
                            success = false;
                        } else {
                            if (t.length > 0) {
                                let aClass = t[0];
                                result.push({
                                    key: aClass.id,
                                    id: aClass.id,
                                    name: aClass.name,
                                    teacher: aClass.teacher,
                                    gpa: rel.gpa
                                });
                            } else {
                                success = false;
                            }
                        }
                    });
                });
                setTimeout(() => {
                    return res.json({
                        success: success,
                        result: result
                    });
                }, 1000);
            }
        });
    } else {
        return res.json({
            success: false
        });
    }
});
server.post('/request/select/getClassByStudent', (req, res) => {
    let connection = mysql.createConnection(dbConnectionInfo);
    let id = req.session.userId;
    if (id) {
        // 找出学生信息
        connection.query('select * from student where id = ? limit 1', [id], (err, students) => {
            if (err) {
                connection.end();
                return res.json({
                    success: false
                });
            }
            if (students.length > 0) {
                let student = students[0];
                // 找出已经选过的课
                connection.query('select * from \`select\` where student = ?', [id], (err, selected) => {
                    if (err) {
                        connection.end();
                        return res.json({
                            success: false
                        });
                    }
                    // 列出学生可以选的所有课
                    connection.query('select * from class where grade = ?', [student.grade], (err, classes) => {
                        if (err) {
                            console.log('!!!');
                            connection.end();
                            return res.json({
                                success: false
                            });
                        }
                        let result = [];
                        // 找出学生没选过的课并且返回
                        classes.map((aClass) => {
                            let find = false;
                            for (let i = 0; i < selected.length; i++) {
                                if (selected[i].class === aClass.id) {
                                    find = true;
                                    break;
                                }
                            }
                            if (!find) result.push({
                                key: aClass.id,
                                id: aClass.id,
                                name: aClass.name,
                                teacher: aClass.teacher,
                                grade: aClass.grade,
                                plan: aClass.plan
                            });
                        });
                        return res.json({
                            success: true,
                            result: result
                        });
                    });
                });
            } else {
                connection.end();
                return res.json({
                    success: false
                });
            }
        });
    } else {
        return res.json({
            success: false
        });
    }
});
server.post('/request/select/new', (req, res) => {
    let args = req.body;
    let studentId = req.session.userId;
    let connection = mysql.createConnection(dbConnectionInfo);
    let success = true;
    args.classes.map((aClass) => {
        // 先查找修读这门课的总人数
        connection.query(`select count(*) from \`select\` where class = ?`, [aClass], (err, result) => {
            if (err) success = false;
            else {
                // 看人数是否已满
                if (result.length > 0) {
                    let count = result[0]['count(*)'];
                    connection.query(`select * from class where id = ?`, [aClass], (err, result) => {
                        if (err) success = false;
                        else {
                            if (result.length > 0) {
                                if (count < result[0].plan) {
                                    connection.query(`insert into \`select\`(student, class) values(?, ?)`,
                                        [studentId, aClass], (err) => {
                                            if (err) success = false;
                                            else success = true;
                                        });
                                } else {
                                    success = false;
                                }
                            } else {
                                success = false;
                            }
                        }
                    });
                } else {
                    success = false;
                }
            }
        });
    });
    setTimeout(() => {
        res.json({
            success: success
        });
    }, 1000);
});

// 导出 server
module.exports.server = server;
