const express = require("express");
const issuesRouter = express.Router({ mergeParams: true });

const sqlite3 = require("sqlite3");
const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

issuesRouter.param("issueId", (req, res, next, issueId) => {
  db.get(`SELECT * FROM Issue WHERE id = ${issueId}`, (err, issue) => {
    if (err) {
      next(err);
    } else if (issue) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

issuesRouter.get("/", (req, res, next) => {
  const sql = "SELECT * FROM Issue WHERE series_id = $seriesId";
  const values = { $seriesId: req.params.seriesId };
  db.all(sql, values, (err, issues) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ issues });
    }
  });
});

issuesRouter.post("/", (req, res, next) => {
  const name = req.body.issue.name;
  const issueNumber = req.body.issue.issueNumber;
  const publicationDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;
  const seriesId = req.params.seriesId;

  db.get(
    "SELECT * FROM Artist WHERE id = $artistId",
    { $artistId: artistId },
    err => {
      if (err) {
        next(err);
      } else if (!name || !issueNumber || !publicationDate || !artistId) {
        return res.sendStatus(400);
      } else {
        const sql = `INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id)
                    VALUES ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`;
        const values = {
          $name: name,
          $issueNumber: issueNumber,
          $publicationDate: publicationDate,
          $artistId: artistId,
          $seriesId: seriesId
        };
        db.run(sql, values, function(err) {
          if (err) {
            next(err);
          } else {
            db.get(
              `SELECT * FROM Issue WHERE id = ${this.lastID}`,
              (err, issue) => {
                if (err) {
                  next(err);
                } else {
                  res.status(201).json({ issue });
                }
              }
            );
          }
        });
      }
    }
  );
});

issuesRouter.put("/:issueId", (req, res, next) => {
  const name = req.body.issue.name;
  const issueNumber = req.body.issue.issueNumber;
  const publicationDate = req.body.issue.publicationDate;
  const artistId = req.body.issue.artistId;
  const seriesId = req.params.seriesId;
  db.get(
    "SELECT * FROM Artist WHERE id = $artistId",
    { $artistId: artistId },
    err => {
      if (err) {
        next(err);
      } else if (!name || !issueNumber || !publicationDate || !artistId) {
        return res.sendStatus(400);
      } else {
        const sql = `UPDATE Issue 
                        SET name = $name, 
                            issue_number = $issueNumber, 
                            publication_date = $publicationDate, 
                            artist_id = $artistId, 
                            series_id = $seriesId
                     WHERE id = $id
                    `;
        const values = {
          $name: name,
          $issueNumber: issueNumber,
          $publicationDate: publicationDate,
          $artistId: artistId,
          $seriesId: seriesId,
          $id: req.params.issueId
        };
        db.run(sql, values, err => {
          if (err) {
            next(err);
          } else {
            db.get(
              `SELECT * FROM Issue WHERE id = ${req.params.issueId}`,
              (err, issue) => {
                if (err) {
                  next(err);
                } else {
                  res.status(200).json({ issue });
                }
              }
            );
          }
        });
      }
    }
  );
});

issuesRouter.delete("/:issueId", (req, res, next) => {
  const sql = "DELETE FROM Issue WHERE id = $id";
  const values = { $id: req.params.issueId };
  db.run(sql, values, err => {
    if (err) {
      next(err);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = issuesRouter;
