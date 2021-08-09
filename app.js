const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require('lodash');
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("<insert your mongodb connection>", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todo list!"
});

const item2 = new Item({
  name: "Hit the checkbox to delete an item."
});
const item3 = new Item({
  name: "Create a new list by adding a forward slash / followed by your list name to the URL above"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
}
const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  const day = date.getDate();
  Item.find({}, function(err, foundItems) {
    if (err)
      console.log(err);
    else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err) {
          if (err)
            console.log(err);
        })
        res.redirect("/");
      } else
        res.render("list", {
          listTitle: day,
          newListItems: foundItems,
        });
    }
  })
});

app.get("/:costumName", function(req, res) {
  const costumName = _.capitalize(req.params.costumName);
  List.findOne({
    name: costumName
  }, async function(err, foundList) {
    if (err)
      console.log(err);
    else {
      if (!foundList) {
        const list = new List({
          name: costumName,
          items: defaultItems,
        })
        await list.save();
        res.redirect("/" + costumName);
      } else {
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  })
});

app.post("/", function(req, res) {
  const listName = req.body.list;
  const item = new Item({
    name: req.body.newItem
  });
  if (listName === date.getDate()) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, listFound) {
      listFound.items.push(item);
      listFound.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === date.getDate()) {
    Item.findByIdAndRemove(checkedItemId, function(err) {
      if (err)
        console.log(err);
      else {
        res.redirect("/");
      }
    })
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkedItemId
        }
      }
    }, function(err, foundList) {
      if (err)
        console.log(err);
      else
        res.redirect("/" + listName);
    })
  }
})

app.listen(process.env.PORT || 3000, function() {
  console.log("Server has started successfully.");
});
