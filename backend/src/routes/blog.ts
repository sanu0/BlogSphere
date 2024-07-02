import { Hono } from "hono";
import {decode , sign, verify} from 'hono/jwt'
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { JWTPayload } from "hono/utils/jwt/types";

export const blogRouter = new Hono<{
    Bindings: {
        DATABASE_URL : string,
        JWT_SECRET : string,
    },
    Variables:{
        userId : any, //Need some research here
    }
}>();

//middileware
blogRouter.use('/*', async (c, next) => {
    const authHeader = c.req.header("authorization") || "";
    //Bearer token
    const token = authHeader.split(" ")[1] 
  
  
    const response = await verify(token , c.env.JWT_SECRET)
  
    if(response){
        c.set("userId", response.id)
        await next()
    }else{
      c.status(403)
      return c.json({error : "unauthorized"})
    }
})

//------------------------------Routes/Endpoints------------------------------------------------------------------------------------

blogRouter.post('/', async(c) => {
    const body = await c.req.json();
    const userId = c.get("userId");
	const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,  //Here c.env was giving error due to typescript so we have to specify in typescript that DATABASE_URL is string.
      }).$extends(withAccelerate())

      const blog = await prisma.post.create({
        data:{
            title : body.title,
            content : body.content,
            authorId : userId
        }
      })

      return c.json({
        id : blog.id
      });
})

blogRouter.put('/', async(c) => {
	const body = await c.req.json();
	const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,  //Here c.env was giving error due to typescript so we have to specify in typescript that DATABASE_URL is string.
      }).$extends(withAccelerate())

      const blog = await prisma.post.update({
        where:{
            id : body.id
        },
        data : {
            title : body.title,
            content : body.content,
        }
      })

      return c.json({
        id : blog.id
      });
})

//Todo here is to add pagination
blogRouter.get('/bulk' , async(c)=>{
	const prisma = new PrismaClient({
    datasourceUrl: c.env?.DATABASE_URL,  //Here c.env was giving error due to typescript so we have to specify in typescript that DATABASE_URL is string.
    }).$extends(withAccelerate())

    const blog = await prisma.post.findMany();
    return c.json({
        blog
    })

})

blogRouter.get('/:id', async(c) => {
	const id = await c.req.param("id");
	const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,  //Here c.env was giving error due to typescript so we have to specify in typescript that DATABASE_URL is string.
      }).$extends(withAccelerate())

      try{
        const blog = await prisma.post.findFirst({
            where:{
                id : id
            }
          })
    
          return c.json({
            blog
          });
      }catch(e){
        c.status(411);
        return c.json({
         message : "Error while fetching blog post"
        })
      }
      
})


