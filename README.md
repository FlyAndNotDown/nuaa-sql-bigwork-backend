# 介绍
NUAA 2018 数据库课程实验，一个基于B/S架构的教务系统，作者 NUAA 161520311

该项目分为前后端两部分，你看到的这部分为后端，即服务器部分，使用到的技术栈为`Nodejs` + `Express`

# 数据库配置
在部署之前，你需要在部署机器上安装MySQL，并且在数据库中按照如下的指令建立数据库、用户和表：
```
// 创建用户kindem，当然你也可以在配置文件中更改
mysql> create user 'kindem'@'%' identified by '123456';
mysql> grant all privileges on *.* to 'kindem'@'%' identified by '123456';
mysql> flush privileges;

// 创建数据库
mysql> create database student_info_manager;
// 进入数据库
mysql> use student_info_manager;
// 建立三张表
mysql> create table student(
     >      id bigint primary key not null auto_increment,
     >      number char(11) not null,
     >      name char(40) not null,
     >      college char(40) not null,
     >      major char(40) not null,
     >      sex char(2) not null,
     >      grade char(4) not null,
     >      phone char(11) not null
     > );
mysql> create table class(
     >      id bigint primary key not null auto_increment,
     >      name char(50) not null,
     >      teacher char(50) not null,
     >      grade char(4) not null,
     >      plan smallint not null
     > );
mysql> create table `select`(
     >      id bigint primary key not null auto_increment,
     >      class bigint not null,
     >      student bigint not null,
     >      gpa float(3,1)
     > );
```

# 后端环境配置
你需要先安装`nodejs`，在安装完`nodejs`之后，你需要在命令行安装推荐的包管理工具`yarn`：
```
npm install -g yarn
```

之后进入项目根目录，使用`yarn`一键安装所有的依赖：
```
yarn install
```

当安装完成之后，你即可使用`yarn`来启动express服务：
```
yarn start
```
等待前端的请求吧！

# 基于配置文件的设置
你可以在项目根目录下找到`config.js`文件，该文件中有一些关于项目的配置，你可以在启动服务器之间修改这些配置。

# 登录
* 学生身份：学号为用户名，密码为手机号后四位
* 管理员身份：admin, admin
