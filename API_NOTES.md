# Users API Notes



Base URL: https://playground.nileslabs.com/api/v1

Documentation: https://playground.nileslabs.com/docs/users



Example values below are illustrative.

Success status shown in the documentation: 200 for all three operations.



## 1. List users



Method: GET

Endpoint: /users

Request body: None



Response structure:

```json

{

  "data": [

    {

      "id": 1,

      "name": "Demo User",

      "username": "demo",

      "email": "demo@example.com",

      "phone": "555-0100",

      "website": "example.com"

    }

  ],

  "pagination": {

    "page": 1,

    "limit": 10,

    "total": 1,

    "totalPages": 1,

    "hasNextPage": false,

    "hasPrevPage": false

  }

}

```



Sandbox-created records can also contain `_sandbox`.

Default page size: 10.

The users array is inside `data`.



## 2. Create user



Method: POST

Endpoint: /users

Header: Content-Type: application/json



Documented request example fields:

```json

{

  "name": "Demo User",

  "username": "demo",

  "email": "demo@example.com",

  "phone": "555-0100",

  "website": "https://example.com"

}

```



Response structure:

```json

{

  "id": "local-example-uuid",

  "name": "Demo User",

  "username": "demo",

  "email": "demo@example.com",

  "_sandbox": "created"

}

```



The server generates the real ID.

Example fields do not necessarily mean required fields.



## 3. Update user



Method: PATCH

Endpoint: /users/:id

Header: Content-Type: application/json



Replace :id with the actual user ID.

Send changed fields only.



Request example:

```json

{

  "name": "Updated Demo",

  "website": "https://example.org"

}

```



Response structure:

```json

{

  "id": 1,

  "name": "Updated Demo",

  "username": "demo",

  "email": "demo@example.com",

  "website": "https://example.org",

  "_sandbox": "updated"

}

```



## App validation



- Name cannot be empty.

- Email must contain @.



## Setup concepts



- npm run dev starts the Vite development server.

- node_modules contains installed dependencies; do not commit it.

- Commit package.json and package-lock.json to reproduce installation.


