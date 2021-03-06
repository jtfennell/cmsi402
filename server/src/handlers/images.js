var database  = require('../../../database/pg-client.js');
var cloudinary = require('cloudinary');

var images = {
    getUrls: (req, res) => {
        var typeOfImage = req.query.type;
        var groupId = req.query.groupId;
        var userId = req.query.userId;
        var albumId = req.query.albumId;

        if (!typeOfImage) {
            return res.status(400).json({"message":"type required"});
        };

        var getImages = {
            'userProfile': () => {
                if (!userId) {
                    return res.status(400).json("bad request")
                };
                database.query(
                    `SELECT image_id, date_uploaded, url
                    FROM users NATURAL JOIN images
                    WHERE user_id=${userId}`
                    , (err, result) => {
                        if (err) {
                            return res.status(500).json("internal server error");
                        }

                        if (!result.rows[0]) {
                            return res.status(404).json("no profile picture");
                        }
                        return res.status(200).json(result.rows);
                    }
                );
            }, 
            'groupAll': () => {
                if (!groupId) {
                    return res.status(400).json({"message":"group required"});
                };
                database.query(
                    `SELECT * 
                    FROM group_contains_user
                    WHERE group_id=${groupId}
                    AND user_id=${req.authenticatedUser.userId}`,
                    (err, result) => {
                        if (!result.rows[0]) {
                            return res.status(403).json({"message":"forbidden"});
                        };

                        database.query(
                            `SELECT image_id, date_uploaded, url
                            FROM group_contains_image NATURAL JOIN images
                            WHERE group_id=${req.authenticatedUser.userId}`
                            , (err, result) => {
                                if (err) {
                                    return res.status(500).json("internal server error");
                                }

                                return res.status(200).json(result.rows);
                            }
                        );
                    }
                );
            },
            'groupProfile': () => {
                if (!groupId) {
                    return res.status(400).json({"message":"group required"});
                };
                database.query(
                    `SELECT * 
                    FROM group_contains_user
                    WHERE group_id=${groupId}
                    AND user_id=${req.authenticatedUser.userId}`,
                    (err, result) => {
                        if (!result.rows[0]) {
                            return res.status(403).json({"message":"forbidden"});
                        };

                        database.query(
                            `SELECT image_id, date_uploaded, url
                            FROM groups, images
                            WHERE group_id=${groupId}
                            AND groups.group_image_id=images.image_id`
                            , (err, result) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).json("internal server error");
                                }

                                return res.status(200).json(result.rows);
                            }
                        );
                    }
                );
            }, groupAlbum: () => {
                console.log(groupId)
                console.log(albumId)
                if (!groupId || !albumId) {
                    return res.status(400).json({"message":"group and albumId required"});
                };
                database.query(
                    `SELECT * 
                    FROM group_contains_user
                    WHERE group_id=${groupId}
                    AND user_id=${req.authenticatedUser.userId}`,
                    (err, result) => {
                        if (!result.rows[0]) {
                            return res.status(403).json({"message":"forbidden"});
                        };

                        database.query(
                            `SELECT images.image_id, date_uploaded, url
                            FROM images, album_contains_image   
                            WHERE album_contains_image.album_id=${albumId}
                            AND images.image_id=album_contains_image.image_id
                            ORDER by images.image_id DESC`
                            , (err, result) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).json("internal server error");
                                }

                                return res.status(200).json(result.rows);
                            }
                        );
                    }
                );
            }
        }

        if(!getImages[typeOfImage]) {
            return res.status(400).json("bad type");
        }
        getImages[typeOfImage]()
    },

    add: (req, res) => {
        var typeOfImage = req.body.type;
        var groupId = req.body.groupId;
        var imageUrl = req.body.url;
        var albumId = req.body.albumId;

        if (!(typeOfImage && imageUrl)) {
            return res.status(400).json({"message":"bad request"});
        };

         var addImage = {
            'profile': () => {
                var imageId;
                database.query(
                    `INSERT INTO images(url, date_uploaded)
                    VALUES ('${imageUrl}', '${Date.now()}')
                    RETURNING image_id`,
                    (err, result) => {
                        if (err) {
                            console.log('error # 1');
                            console.log(err);
                            return res.status(500).json("internal server error");
                        }
                        imageId = result.rows[0].image_id;

                        database.query(
                            `UPDATE users 
                            SET image_id='${imageId}'
                            WHERE user_id = '${req.authenticatedUser.userId}'`,
                            (err, result) => {
                                if (err) {
                                    console.log('error # 2');
                                    console.log(err)
                                    return res.status(500).json("internal server error");
                                }
                                database.query(
                                    `INSERT INTO user_uploads_image (user_id, image_id)
                                    VALUES ('${req.authenticatedUser.userId}', '${imageId}')`,
                                    (err, result) => {
                                        console.log('error # 3');
                                        console.log(err)
                                        return res.status(204).json({"message":"profile picture saved"});
                                    }
                                )
                            }
                        )
                    }
                )
            }, 
            'group': () => {
                if (!groupId) {
                    return res.status(400).json({"message":"group required"});
                };                
            },
            'groupAlbum': () => {
                console.log(typeOfImage, groupId, albumId)
                if (!typeOfImage || !groupId || !albumId) {
                    return res.status(400).json("bad request")
                };

                database.query(
                    `SELECT * 
                    FROM group_contains_user
                    WHERE group_id=${groupId}
                    AND user_id=${req.authenticatedUser.userId}`,
                    (err, result) => {
                        if (!result.rows[0]) {
                            return res.status(403).json({"message":"forbidden"});
                        };

                        database.query(
                            `INSERT INTO images(url, date_uploaded)
                            VALUES ('${imageUrl}', '${Date.now()}')
                            RETURNING image_id`
                            , (err, result) => {
                                if (err) {
                                    console.log(err);
                                    return res.status(500).json("err");
                                }
                                var imageId = result.rows[0].image_id;

                                database.query(
                                    `INSERT INTO user_uploads_image(user_id, image_id)
                                    VALUES (${req.authenticatedUser.userId}, ${imageId})`
                                    , (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            return res.status(500).json("err");
                                        }
                                        database.query(
                                            `INSERT INTO album_contains_image(album_id, image_id)
                                            VALUES (${albumId}, ${imageId})`
                                            , (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    return res.status(500).json("err");
                                                }
                                                return res.status(200).json("image saved")                                    }
                                        )                                  
                                    }
                                )
                            }
                        )
                    }
                )
            }
        }
        if(!addImage[typeOfImage]) {
            return res.status(400).json("bad type");
        }
        addImage[typeOfImage]()
    },

    delete: (req, res) => {
        return res.status(501).json("not implemented");
    }
}

module.exports = images;