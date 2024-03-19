import { Hono } from "hono";
import { cors } from "hono/cors"
import { createClient } from "@libsql/client";
import { v4 as uuidV4 } from "uuid";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
dotenv.config();
import {Recipe, Ingredient} from "./models.ts"

const PORT = process.env.PORT as unknown as number || 8080;

const app = new Hono();
app.use(cors());

const db = createClient({
    url: process.env.LOCAL_DB as string,
    syncUrl: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
    // syncInterval: 15 - https://docs.turso.tech/sdk/ts/reference#periodic-sync
});

app.get("/", async (c) => {   
    await db.batch([
      "CREATE TABLE IF NOT EXISTS recipes (id VARCHAR PRIMARY KEY,name VARCHAR NOT NULL,nutrition_information TEXT,instructions TEXT,created_at INTEGER DEFAULT(CAST(UNIXEPOCH() AS INT)),updated_at INTEGER DEFAULT(CAST(UNIXEPOCH() AS INT)));",
      "CREATE TABLE IF NOT EXISTS ingredients (id VARCHAR PRIMARY KEY,name VARCHAR NOT NULL,measurements VARCHAR NOT NULL,recipe_id VARCHAR NOT NULL,created_at INTEGER DEFAULT(CAST(UNIXEPOCH() AS INT)),updated_at INTEGER DEFAULT(CAST(UNIXEPOCH() AS INT)),FOREIGN KEY(recipe_id) REFERENCES recipes(id));",
      "CREATE INDEX IF NOT EXISTS idx_recipe_name on recipes(name);",
      "CREATE INDEX IF NOT EXISTS idx_ingredient_name on ingredients(name);",
    ]);
  
    return c.json({ ok: 200, message: "Created database schema!" });
  });
  
  app.get("/recipes", async (c) => {
    const results = await db.execute(
      "select recipes.id, recipes.name, recipes.nutrition_information as nutritionInformation, recipes.instructions, recipes.created_at as createdAt, recipes.updated_at as updatedAt, json_group_array(json_object('id', ingredients.id, 'name', ingredients.name, 'measurements', ingredients.measurements)) as ingredients from recipes join ingredients on ingredients.recipe_id = recipes.id group by recipes.id"
    );
  
    return c.json({ recipes: results.rows });
  });
  
  app.post("/recipe", async (c) => {
    const { recipe, ingredients } = (await c.req.json()) as unknown as {
      recipe: Recipe,
      ingredients: Ingredient[]
    };
    
    const recipeId = uuidV4();

    await db.execute({
      sql: "insert into recipes(id, name, nutrition_information, instructions) values (?, ?, ?, ?)",
      args: [
        recipeId,
        recipe.name,
        recipe.nutritionInformation as string,
        recipe.instructions as string,
      ],
    });
 
    const statements = ingredients?.map((ingredient: Ingredient) => ({
      sql: "insert into ingredients(id, name, measurements, recipe_id) values (?, ?, ?, ?)",
      args: [uuidV4(), ingredient.name, ingredient.measurements, recipeId],
    }));

    await db.batch(statements, "write");
    
    await db.sync(); // https://docs.turso.tech/sdk/ts/reference#manual-sync
  
    return c.json({ ok: true });
  });
  
  app.delete("/recipe/:id", async (c) => {
    const id = c.req.param('id');
    await db.execute({
      sql: "delete from ingredients where recipe_id = ?",
      args: [id],
    });
  
    await db.execute({
      sql: "delete from recipes where id = ?",
      args: [id],
    });
  
    return c.json({ ok: true });
  });

serve({
    fetch: app.fetch,
    port: PORT
}, (info) => {
    console.log("App listening to port ", + PORT)
})