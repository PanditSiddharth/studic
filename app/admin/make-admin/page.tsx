// app/(admin)/admin-conversion/page.tsx
'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { admincongrates } from '@/modals/data';
import { IUser } from '@/modals/user.model';
import { sendMail } from '@/server-functions/mailer';
import { checkExistingUser, updateUser } from '@/server-functions/user';
import { useState } from 'react';
import { toast } from 'react-toastify';

const AdminConversionPage = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyResponse, setVerifyResponse] = useState<Partial<IUser>>()
    const handleSubmit = async (e: React.FormEvent) => {
        if (!verifyResponse)
            return toast.info("Please verify first and write only registered students' emails")
        e.preventDefault();
        setLoading(true);

        try {

            const user = await updateUser({email: verifyResponse.email, role: "admin"})
            if( (user as {error: string})?.error)
                return toast.error((user as {error: string})?.error)

            const admind = admincongrates(verifyResponse?.name + "")
           
            const mail = await sendMail({
                email: verifyResponse.email + "",
                subject: "Congratulations to become site admin",
                message: admind
            })
        
            if(mail.message){
                return toast.error(mail.message)
            }

            toast.success("User successfully created role administrator")
        } catch (error) {
            toast.error('An error occurred' + (error as {message: string}).message);
        } finally {
            setLoading(false);
            setEmail('');
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = await checkExistingUser(email)
        if (!data) {
            toast.error('User not found');
            return
        } else if (typeof data !== "boolean") 
           setVerifyResponse(data)
    }

    return (
        <Card className="max-w-xl border-none">
            <CardHeader>
                <h2 className="text-xl font-semibold">Create site Admin</h2>
            </CardHeader>
            <CardContent >
                <Label htmlFor="email" className="mb-2">Write Email:</Label>
                <div className='flex'>
                    <Input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-r-none max-w-96"
                        required
                    />
                    <Button
                        onClick={handleVerify}
                        className="rounded-l-none"
                        disabled={loading}
                    >
                        Verify
                    </Button>
                </div>

                {verifyResponse && <div className='text-sm text-green-500 mt-3'>
                    User found: {verifyResponse.name} @{verifyResponse.username}
                </div>}
                <Button
                    onClick={handleSubmit}
                    className="mt-4"
                    disabled={loading}
                >
                    {loading ? 'Processing...' : 'Create Admin'}
                </Button>
            </CardContent>
        </Card>
    );
};

export default AdminConversionPage;
