This clone is made using nextjs and appwrite

# Start the nextjs app
```bash
pnpx create-next-app@latest
```

- typescript: yes
- tailwind: yes
- src: yes

create a `.env` file 
```env
NEXT_PUBLIC_APPWRITE_HOST_URL=

NEXT_PUBLIC_APPWRITE_PROJECT_ID=

APPWRITE_API_KEY=
```

in `src/app` create `env.ts` for easy access of env variables and satisfying typescript 🤩
```ts
const env = {
  appwrite: {
    endpoint: String(process.env.NEXT_PUBLIC_APPWRITE_HOST_URL),
    project: String(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
    apikey: String(process.env.APPWRITE_API_KEY),
  },
};

export default env;
```

Now make a lot of files 🤯:
```bash
cd src
mkdir server client
touch client/config.ts
touch name.ts index.ts
cd server
touch answer.collection.ts comment.collection.ts question.collection.ts vote.collection.ts storage.collection.ts config.ts dbSetup.ts
```

All of these are for making different collections in appwrite db, the dbSetup file is to connect if the db already exists or make a new one if it doesnt.

This is how the folder structure looks like now
```
└── 📁stackoverflow-clone
    └── 📁public
        └── file.svg
        └── globe.svg
        └── next.svg
        └── vercel.svg
        └── window.svg
    └── 📁src
        └── 📁app
            └── env.ts
            └── favicon.ico
            └── globals.css
            └── layout.tsx
            └── page.tsx
        └── 📁models
            └── 📁client
                └── config.ts
            └── index.ts
            └── name.ts
            └── 📁server
                └── answer.collection.ts
                └── comment.collection.ts
                └── config.ts
                └── dbSetup.ts
                └── question.collection.ts
                └── storage.collection.ts
                └── vote.collection.ts
    └── .env
    └── .gitignore
    └── eslint.config.mjs
    └── next-env.d.ts
    └── next.config.ts
    └── package.json
    └── pnpm-lock.yaml
    └── postcss.config.mjs
    └── README.md
    └── tailwind.config.ts
    └── tsconfig.json
```

# Data Modelling 
## Client Setup
So, for the client configurations in `config.ts` we use this:
```ts
import env from "@/app/env";
import { Client, Account, Databases, Avatars, Storage } from "appwrite";

const client = new Client()
  .setEndpoint(env.appwrite.endpoint) // Your API Endpoint
  .setProject(env.appwrite.project); // Your project ID

const account = new Account(client);
const databases = new Databases(client);
const avatars = new Avatars(client);
const storage = new Storage(client);

export { client, account, databases, avatars, storage };

```

its simple really, we just import everything from appwrite and pass in the client that needs this. So, for example this client needs avatars, database acces, storage, account. Just create a simple client and pass it as the bases for all of it

Now, can we do this same thing in `server/config.ts`? Kinda yes, but if we just copy paste this same thing in server file. #hitesh "It wont be server-server call, it will become routing through frontend and we dont want that."

So now lets see what we need to do in order to create a server side for this project.

## Server Setup
Install the nodesdk for appwrite
```bash
pnpm install node-appwrite
```

`server/config.ts`
```ts
import env from "@/app/env";
import { Client, Avatars, Databases, Storage, Users } from "node-appwrite";

const client = new Client();

client
  .setEndpoint(env.appwrite.endpoint) // Your API Endpoint
  .setProject(env.appwrite.project) // Your project ID
  .setKey(env.appwrite.apikey) // Your secret API key
;

const users = new Users(client);
const databases = new Databases(client);
const avatars = new Avatars(client);
const storage = new Storage(client);

export { client, users, databases, avatars, storage };
```

so, the only difference was where it import those objects from, in server we use `node-appwrite` and in client side, we use `appwrite`. 

## Question Collection
Now, lets create a question collection
`questionCollection.ts`
```ts
import { IndexType, Permission } from "node-appwrite";

import { db, questionCollection } from "../name";
import { databases } from "./config";

export default async function createQuestionCollection() {
  //create collection
  await databases.createCollection(
    db,
    questionCollection,
    "questionCollection",
    [
      Permission.read("any"),
      Permission.read("users"),
      Permission.create("users"),
      Permission.update("users"),
      Permission.delete("users"),
    ]
  );
  console.log("Question collection is created");

  //create attributes and indexes
  await Promise.all([
    databases.createStringAttribute(db, questionCollection, "title", 100, true),
    databases.createStringAttribute(db, questionCollection, "content", 1000, true),
    databases.createStringAttribute(db, questionCollection, "authorID", 50, true),
    databases.createStringAttribute(db, questionCollection, "tags", 50, true, undefined, true),
    databases.createStringAttribute(db, questionCollection, "attachmentID", 50, false),
  ])
  console.log("Question attributes are created");

  //create indexes
  await Promise.all([
    databases.createIndex(db, questionCollection, "title", IndexType.Fulltext, ["title"], ["asc"]),
    databases.createIndex(db, questionCollection, "content", IndexType.Fulltext, ["content"], ["asc"]),
  ])
}


```
we just created a collection and decided whom to give its rights. 

Attributes: They define the structure of data and how it should look like. basically a schema.

Indexes: These are used for efficient querying and searching and sorting purposes

## Answer Collection
`server/answer.collection.ts`
```ts
import { IndexType, Permission } from "node-appwrite";
import { answerCollection, db } from "../name";
import { databases } from "./config";

export default async function createAnswerCollection() {
  // Creating Collection
  await databases.createCollection(db, answerCollection, answerCollection, [
    Permission.create("users"),
    Permission.read("any"),
    Permission.read("users"),
    Permission.update("users"),
    Permission.delete("users"),
  ]);
  console.log("Answer Collection Created");

  // Creating Attributes
  await Promise.all([
    databases.createStringAttribute(
      db,
      answerCollection,
      "content",
      10000,
      true
    ),
    databases.createStringAttribute(
      db,
      answerCollection,
      "questionId",
      50,
      true
    ),
    databases.createStringAttribute(db, answerCollection, "authorId", 50, true),
  ]);
  console.log("Answer Attributes Created");
}
```

here we create a database collection for answers and give the permissions to all to read and crud to users. 

Create the same thing for all of them
`server/vote.collection.ts`
```ts
import { Permission } from "node-appwrite";
import { db, voteCollection } from "../name";
import { databases } from "./config";

export default async function createVoteCollection() {
  // Creating Collection
  await databases.createCollection(db, voteCollection, voteCollection, [
    Permission.create("users"),
    Permission.read("any"),
    Permission.read("users"),
    Permission.update("users"),
    Permission.delete("users"),
  ]);
  console.log("Vote Collection Created");

  // Creating Attributes
  await Promise.all([
    databases.createEnumAttribute(
      db,
      voteCollection,
      "type",
      ["question", "answer"],
      true
    ),
    databases.createStringAttribute(db, voteCollection, "typeId", 50, true),
    databases.createEnumAttribute(
      db,
      voteCollection,
      "voteStatus",
      ["upvoted", "downvoted"],
      true
    ),
    databases.createStringAttribute(db, voteCollection, "votedById", 50, true),
  ]);
  console.log("Vote Attributes Created");
}
```

`server/storageSetup.ts`
```ts
import { Permission } from "node-appwrite";
import { questionAttachmentBucket } from "../name";
import { storage } from "./config";

export default async function getOrCreateStorage() {
  try {
    await storage.getBucket(questionAttachmentBucket);
    console.log("Storage Connected");
  } catch (error) {
    try {
      await storage.createBucket(
        questionAttachmentBucket,
        questionAttachmentBucket,
        [
          Permission.create("users"),
          Permission.read("any"),
          Permission.read("users"),
          Permission.update("users"),
          Permission.delete("users"),
        ],
        false,
        undefined,
        undefined,
        ["jpg", "png", "gif", "jpeg", "webp", "heic"]
      );

      console.log("Storage Created");
      console.log("Storage Connected");
    } catch (error) {
      console.error("Error creating storage:", error);
    }
  }
}
```

`server/comment.collection.ts`
```ts
import { Permission } from "node-appwrite";
import { commentCollection, db } from "../name";
import { databases } from "./config";

export default async function createCommentCollection() {
  // Creating Collection
  await databases.createCollection(db, commentCollection, commentCollection, [
    Permission.create("users"),
    Permission.read("any"),
    Permission.read("users"),
    Permission.update("users"),
    Permission.delete("users"),
  ]);
  console.log("Comment Collection Created");

  // Creating Attributes
  await Promise.all([
    databases.createStringAttribute(
      db,
      commentCollection,
      "content",
      10000,
      true
    ),
    databases.createEnumAttribute(
      db,
      commentCollection,
      "type",
      ["answer", "question"],
      true
    ),
    databases.createStringAttribute(db, commentCollection, "typeId", 50, true),
    databases.createStringAttribute(
      db,
      commentCollection,
      "authorId",
      50,
      true
    ),
  ]);
  console.log("Comment Attributes Created");
}
```

## DB Setup

`dbSetup.ts`
```ts
import { db } from "../name";
import createAnswerCollection from "./answer.collection";
import createCommentCollection from "./comment.collection";
import createQuestionCollection from "./question.collection";
import createVoteCollection from "./vote.collection";

import { databases } from "./config";

export default async function getOrCreateDB() {
  try {
    await databases.get(db);
    console.log("Database connection");
  } catch (error) {
    try {
      await databases.create(db, db);
      console.log("database created");
      //create collections
      await Promise.all([
        createQuestionCollection(),
        createAnswerCollection(),
        createCommentCollection(),
        createVoteCollection(),
      ]);
      console.log("Collection created");
      console.log("Database connected");
    } catch (error) {
      console.log("Error creating databases or collection", error);
    }
  }

  return databases;
}
```

Creating db is just as simple, we just import all of the collections that we made and perform a check using getorcreatedb so we either have a database or create one and if we need to create one then we just make all the collections and export databases.

# Setting up middleware in nextjs
#hitesh "The file name should be exactly `middleware.ts`. If you forget about middleware then google 'middleware nextjs'"

For now we will just copy the middleware from website and follow along with it.
```ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL("/home", request.url));
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: "/about/:path*",
};
```

#hitesh "Wherever the matcher is matching, our middleware code will not run there." So this means we need to fix the matcher as well.

we add this to the matcher as a list 👇 (its just all regex that we can get with chatgpt)
```ts
matcher: [ "/((?!api|_next/static|_next/image|favicon.ico).*)", ];
```

The prompt: "Give me the regex to add into nextjs middleware matcher so that it covers all routes except these:
    - api (API routes)
    - _next/static (static files)
    - _next/image (image optimization files)
    - favicon.ico (favicon file)
"

Now we need to add our database and storage creation functions in middleware so that it creates the db if it doesnt exists or get the db if it exists.
```ts
export async function middleware(request: NextRequest) {
  await Promise.all([getOrCreateDB(), getOrCreateStorage()]);
  return NextResponse.next();
}
```

The `NextResponse.next();` means that it needs to continue to the either the next middleware or do what needs to be done.

Finally!!!, we will try to run this and check if there are any errors 😶‍🌫

```console
➜  stackoverflow-clone git:(main) ✗ p dev                      

> stackoverflow-clone@0.1.0 dev /root/Javascript/hitesh-course/stackoverflow-clone
> next dev --turbopack

   ▲ Next.js 15.1.7 (Turbopack)
   - Local:        http://localhost:3000
   - Network:      http://10.255.255.254:3000
   - Environments: .env

 ✓ Starting...
 ✓ Compiled in 379ms
 ✓ Ready in 1337ms
Storage Created
Storage Connected
database created
Question collection is created
Comment Collection Created
Answer Collection Created
Vote Collection Created
Question attributes are created
Answer Attributes Created
Vote Attributes Created
Error creating databases or collection AppwriteException: Attribute not available: content
    at async createQuestionCollection (src/models/server/question.collection.ts:33:2)
    at async getOrCreateDB (src/models/server/dbSetup.ts:18:6)
    at async middleware (src/middleware.ts:9:2)
  31 |
  32 |   //create indexes
> 33 |   await Promise.all([
     |  ^
  34 |     databases.createIndex(db, questionCollection, "title", IndexType.Fulltext, ["title"], ["asc"]),
  35 |     databases.createIndex(db, questionCollection, "content", IndexType.Fulltext, ["content"], ["asc"]),
  36 |   ]) {
  code: 400,
  type: 'attribute_not_available',
  response: {
  message: 'Attribute not available: content',
  code: 400,
  type: 'attribute_not_available',
  version: '1.6.1'
}
}
Comment Attributes Created
 ○ Compiling / ...
 ✓ Compiled / in 1943ms
 GET / 200 in 2134ms
Database connection
Storage Connected
Storage Connected
Database connection
Database connection
Storage Connected
Storage Connected
Database connection
Storage Connected
Database connection
 ✓ Compiled /favicon.ico in 113ms
 GET /favicon.ico?favicon.45db1c09.ico 200 in 153ms
```
everything seems to be fine except of the question collection which shows some attribute not available error 

Behaviour as far as i can interpret: It makes the title index on running for the first time. The issue might just be with creating a content index or creating multiple indexes at the same time.

To check this theory lets just comment out the comment index and try to run this. 

Funny enough it only gives the error for index if we add content to it now lets check if content line has any problem or not. 

The only issue seems to be with content line well i dont know what the issue is and hitesh says, he has been trying to debug this issue for a long time now so might as well just leave it at that. 

# Work with Zustand

Steps 👇:
1. imports
2. interface definitions
3. create zustand store
	1. immer
	2. persist
4. store state and methods
5. Rehydration

## imports
First of all create a new file: 
`src/store/Auth.ts`
```ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

import { AppwriteException, ID, Models } from "appwrite";
import { account } from "@/models/client/config";
```
All of this will be persisted in localstorage thats why we are using account and all from the client side.
According to the project requirements, if we need to save the data in server side as well we can do that by importing what we need from server side.

## Interface definitions
This step is only really needed if the project is in typescript otherwise we can ignore this part.
```ts
export interface UserPrefs {
  reputation: number;
}

interface IAuthStore {
  session: Models.Session | null;
  jwt: string | null;
  user: Models.User<UserPrefs> | null;
  hydrated: boolean;

  setHydrated(): void;
  verifySession(): Promise<void>;
  login(
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: AppwriteException | null;
  }>;
  register(
    name: string,
    email: string,
    password: string
  ): Promise<{
    success: boolean;
    error?: AppwriteException | null;
  }>;
  logout(): Promise<void>;
  updatePrefs(prefs: UserPrefs): Promise<void>;
}
```

