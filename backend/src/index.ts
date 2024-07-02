import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import {decode , sign, verify} from 'hono/jwt'

import { Hono } from 'hono'
import { userRouer } from './routes/user'
import { blogRouter } from './routes/blog'


const app = new Hono<{
  Bindings: {
    DATABASE_URL : string,
    JWT_SECRET : string,
  }
}>()//This is the syntax.


//---------------------------------------------------------------------------------------------------------------

app.route('/api/v1/user',userRouer);
app.route('api/v1/blog',blogRouter);

//--------------------------------

// app.get('/', (c) => {
//   return c.text('Hello Hono!')
// })

export default app
