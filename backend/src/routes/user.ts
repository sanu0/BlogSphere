import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import {decode , sign, verify} from 'hono/jwt'
// import { signupInput } from "../zod";
import { signupInput , signinInput } from "@kumar.sanu/medium-common";

export const userRouer = new Hono<{
    Bindings: {
        DATABASE_URL : string,
        JWT_SECRET : string,
      }
}>();

userRouer.post('/signup', async(c) => {
    const body = await c.req.json();
    const {success} = signupInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({
            message : "Incorrect Inputs",
        })
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL,  //Here c.env was giving error due to typescript so we have to specify in typescript that DATABASE_URL is string.
    }).$extends(withAccelerate())
    //Now there is some great thing to learn here is that you dont get environment variables access outside, why do we get it in c (context), the reason
    //is that every route in hono might be deployed independently, and that is why you dont get access to your environment variable globally and you have to
    //do it everytime using c as at each endpoint which may be deployed at some random place independently, have to access the env variables for them, and
    //gloal one do not work. So you have to do it everytime at each points.

    try {
        const user = await prisma.user.create({
            data: {
                email: body.email,
                password: body.password,
                name : body.name
            }
        });
        const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.json({ jwt });
    } catch(e) {
        c.status(411);
        console.log(e);
        return c.json({ error: "error while signing up" });
    }
  })
  
  
  userRouer.post('/signin', async(c) => {
    const body = await c.req.json();
    const {success} = signinInput.safeParse(body);
    if(!success){
        c.status(411);
        return c.json({
            message : "Incorrect Inputs"
        })
    }

    const prisma = new PrismaClient({
        datasourceUrl: c.env?.DATABASE_URL	,
    }).$extends(withAccelerate());

    
    const user = await prisma.user.findUnique({
        where: {
            email: body.email,
            password : body.password
        }
    });

    if (!user) {
        c.status(403);
        return c.json({ error: "user not found" });
    }

    const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
    return c.json({ jwt });
})