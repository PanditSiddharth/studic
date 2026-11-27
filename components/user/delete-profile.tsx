"use client"
import { IUser } from '@/modals/user.model'
import { toast } from 'react-toastify'
import { Card } from '../ui/card'
import { deleteUser } from '@/server-functions/user'
import Image from 'next/image'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useState } from 'react'
import { signOut } from 'next-auth/react'

const HandleDeleteAccount = ({ user, openedDelete, setOpenedDelete }: {
    user: IUser,
    openedDelete: boolean, setOpenedDelete: any
}) => {
    const [input, setInput] = useState("")
    return openedDelete &&
        <Card className="z-20 p-4 max-w-xl sm:max-w-xl md:w-xl fixed right-0 left-0 top-16 rounded-lg shadow-lg mx-auto">
            <h3 className="text-lg font-semibold mb-2">Delete User</h3>
            <p className="text-xs mb-4 text-red-400">
                Are you sure you want to delete Your account? This action cannot be undone.
            </p>
            {user && (
                <div className="border-t  pt-4">
                    <div className="flex items-center gap-4 mb-4">
                        <Image
                            src={user.image + ""}
                            alt={user.name}
                            width={80}
                            height={80}
                            className="rounded-md object-cover border"
                        />
                        <div>
                            <h4 className="font-medium">{user.name}</h4>
                            <small className="text-gray-500">@{user.username + ""}</small>
                        </div>
                    </div>

                </div>
            )}
            <div className='mt-4 mb-4 flex flex-col space-y-4'>
                <p className='text-xs md:text-sm'>To delete your account write @{user.username} bellow</p>
                <Input onChange={e => { setInput(e.target.value) }} className='' />
            </div>
            <div className="mt-4 flex gap-3">
                <Button
                    className="bg-red-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-red-700"
                    disabled={input != "@" + user.username}
                    onClick={() => {
                        deleteUser(user._id!).then((res) => {
                            if (res?.success) {
                                toast.success("Account deleted successfully")
                            
                                signOut({redirect: true})
                            }
                            else toast.error(res.error)

                        })
                    }
                    } >
                    Confirm
                </Button>
                <button
                    className="bg-gray-300 text-gray-800 px-4 py-1.5 rounded-lg font-semibold hover:bg-gray-400"
                    onClick={() => {
                        setOpenedDelete(false);
                    }}
                >
                    Cancel
                </button>
            </div>
        </Card>

}


export default HandleDeleteAccount