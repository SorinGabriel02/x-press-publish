const express = require("express");
const sqlite3 = require("sqlite3");
const issuesRouter = require("./issues");

const seriesRouter = express.Router();

const db = new sqlite3.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

seriesRouter.param("seriesId", (req, res, next, seriesId) => {
  db.get(
    "SELECT * FROM Series WHERE id = $id",
    { $id: seriesId },
    (err, series) => {
      if (err) {
        next(err);
      } else if (series) {
        req.series = series;
        next();
      } else {
        res.sendStatus(404);
      }
    }
  );
});

seriesRouter.use("/:seriesId/issues", issuesRouter);

seriesRouter.get("/", (req, res, next) => {
  db.all("SELECT * FROM Series", (err, series) => {
    if (err) {
      next(err);
    } else {
      res.status(200).json({ series });
    }
  });
});

seriesRouter.get("/:seriesId", (req, res, next) => {
  res.status(200).json({ series: req.series });
});

seriesRouter.post("/", (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    return res.sendStatus(400);
  }
  db.run(
    "INSERT INTO Series (name, description) VALUES ($name, $description)",
    {
      $name: name,
      $description: description
    },
    function(err) {
      if (err) {
        next(err);
      } else {
        db.get(
          "SELECT * FROM Series WHERE id = $id",
          { $id: this.lastID },
          (err, series) => {
            if (err) {
              next(err);
            } else {
              res.status(201).json({ series });
            }
          }
        );
      }
    }
  );
});

seriesRouter.put("/:seriesId", (req, res, next) => {
  const { name, description } = req.body.series;
  if (!name || !description) {
    return res.sendStatus(400);
  }
  const sql = `UPDATE Series
                SET name = $name, description = $description  
                WHERE id = $id`;
  const values = {
    $name: name,
    $description: description,
    $id: req.params.seriesId
  };
  db.run(sql, values, err => {
    if (err) {
      next(err);
    } else {
      db.get(
        "SELECT * FROM Series WHERE id = $id",
        { $id: req.params.seriesId },
        (err, series) => {
          if (err) {
            next(err);
          } else {
            res.status(200).json({ series });
          }
        }
      );
    }
  });
});

seriesRouter.delete("/:seriesId", (req, res, next) => {
  const sql = "SELECT * FROM Issue WHERE Issue.series_id = $seriesId";
  const values = { $seriesId: req.params.seriesId };
  db.get(sql, values, (err, series) => {
    if (err) {
      next(err);
    } else if (series) {
      return res.sendStatus(400);
    } else {
      db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`, err => {
        if (err) next(err);
      });
      res.sendStatus(204);
    }
  });
});

module.exports = seriesRouter;
