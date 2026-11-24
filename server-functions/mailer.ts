"use server"
import { sendTransactionalMail } from "@/lib/mail";
import { getSessionUser } from "./user";

export async function sendMail(data: {email: string, subject: string, message: string}){
try{
const user = await getSessionUser()
if(!user ||!user?.email)
    return ({message: "User not logged in."})
if(user.role !== "admin")
    return ({message: "Only admin can send emails."})

if(!data || !data?.email || !data?.subject || !data?.message)
return ({message: "All fields are required."})

  const res = await sendTransactionalMail({
    to: data.email,
    subject: data.subject,
    html: data.message,
  });

return {success: true, res}

} catch(err){
    console.error(err)
    return { message: (err as {message: string}).message }
}
};
