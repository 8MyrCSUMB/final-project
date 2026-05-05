DROP TABLE IF EXISTS likedMusic;
DROP TABLE IF EXISTS admin;
DROP TABLE IF EXISTS login;

CREATE TABLE login (
    userId INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    firstname VARCHAR(20) NOT NULL,
    lastname VARCHAR(20) NOT NULL,
    dob DATE NOT NULL,
    sex VARCHAR(1) NOT NULL
);

CREATE TABLE admin (
    adminId INT PRIMARY KEY NOT NULL AUTO_INCREMENT,
    username VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    firstname VARCHAR(100) NOT NULL,
    lastname VARCHAR(200) NOT NULL
);

CREATE TABLE likedMusic (
    musicid BIGINT NOT NULL,
    userId INT NOT NULL,
    songName VARCHAR(100) NOT NULL,
    artistName VARCHAR(100) NOT NULL,
    musicLink VARCHAR(255) NOT NULL,
    pictureLink VARCHAR(255),
    PRIMARY KEY (musicid, userId), 
    FOREIGN KEY (userId) REFERENCES login(userId) ON DELETE CASCADE
);

INSERT INTO login (username, email, password, firstname, lastname, dob, sex) VALUES
('Gabriel', 'gpillegand@csumb.edu', '$2b$10$jF2EuZochWk4JX1/bz450.yPeVAzoORhRgtcLkcT6l2tXAhC0CkBm', 'Gabriel', 'Pillegand', '2006-04-08', 'M'),
('Aryll', 'apacheco@csumb.edu', '$2b$10$BVLzw58mLMlv1PFW3GqyFuYmJUldNpwP6pBM3y7Wpr2OfHec1pMaK', 'Aryll', 'Pacheco', '1998-07-22', 'F'),
('Anthony', 'apietri@csumb.edu', '$2b$10$bWF0eyjS602bawJl//USlOCRe0MvOVDEQH0EaaNQISDKBRCwsvs1e', 'Anthony', 'Pietri', '1988-12-01', 'M'),
('Alexandre', 'aperaldi@csumb.edu', '$2b$10$Yok6r2Gc6OaLW/e69KG3iOJWRqyW61I6GAHluqRGuCMp39i6ViJBa', 'Alexandre', 'Peraldi', '2001-05-10', 'O');

INSERT INTO admin (username, password, firstname, lastname) VALUES
('admin', '$2b$10$3KVH/CwCJlJcH6y/P4wIJ.lbx6/rtsU67SoznL5jSANYb3TSwNE7m', 'System', 'Administrator');