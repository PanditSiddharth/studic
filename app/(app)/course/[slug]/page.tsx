"use client"
import { BlogCard, CourseCard } from '@/components/Cards'
import Loader from '@/components/loader'
import { ICourse } from '@/modals/course.model'
import { getCourse } from '@/server-functions/course'
import { useDataStore } from '@/store'
import { Book, BookAIcon, Home } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const Course = ({ params }: { params: Promise<any> }) => {
  const pd = useDataStore<ICourse | undefined>("course", undefined)()  const prs = React.use(params)
  const [loading, setLoading] = useState(true)  useEffect(() => {
    if (prs && prs.slug) {
      console.log(prs)
      getCourse({ blogs: true, slug: prs.slug }).then(course => {
        console.log(course, "course")
        setLoading(false)
        if (typeof course == "object" && "error" in course) return
        pd.setData(course as ICourse)
        // const n: any = [];
        // for (let i = 0; i < 20; i++) {
        //   course.content?.forEach((blog: any) => n.push({ ...blog, _id: Math.random() }))
        // }
        // pd.setData({ ...course, content: n } as ICourse)
      })
    }
  }, [prs])

  if (loading) return <Loader />

  if (!pd || !pd.data || !pd.data.title) return <div className='fixed inset-0 flex items-center justify-center'>
    Not Found</div>

  return (
    <div className='w-full space-y-3 md:pl-[8%] lg:pl-2'>


      <div className="hidden fixed top-0 left-0 h-screen pt-[4rem] md:flex 
      md:w-[8%] place-content-start space-y-10 px-4 flex-col items-center">
        <Link href={"/"} className='flex flex-col items-center'>
          <Home />
          <div className='text-xs'>Home</div>
        </Link>
        <Link href={"/courses"} className='flex flex-col items-center'>
          <BookAIcon />
          <div className='text-xs'>Courses</div>
        </Link>
        <Link href={"/blogs"} className='flex flex-col items-center'>
          <Book />
          <div className='text-xs'>Blogs</div>
        </Link>
      </div>

        <div className={`w-full lg:w-[30%] lg:fixed lg:top-14 lg:pt-8 lg:left-[8%] lg:h-screen 
        relative bg-cover rounded-sm bg-center`} style={{ backgroundImage: `url(${pd.data.thumbnail})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          {/* this is image */}
          <div className='h-full w-full left-0 top-0 absolute bg-gradient-to-b  backdrop-blur-xl z-10' />
          <div className='h-full w-full left-0 top-0 absolute bg-gradient-to-b  from-background/70 via-transparent to-background z-20' />
          <BlogCard
            title={pd.data.title}
            slug={pd.data.slug}
            image={pd.data.thumbnail}
            description={<p className='text-sm line-clamp-3 pt-2'>{pd.data.description}</p>}
            component={<div></div>}
            className='mx-6 relative z-30 bg-black/10 text-white border-none shadow-none'
            className2='bg-transparent px-1 pt-4'
            imageClass='rounded-lg'
          />
        </div>

        <div className='relative w-full px-4 space-y-2 lg:pl-[38%] bg-gradient-to-b from-forground to-transparent'>
          {pd.data?.content?.map((blog: any) => (
            <Link href={"/course/" + pd.data?.slug + "/" + blog.slug} 
            key={blog._id} className={"flex flex-row px-2 h-20 w-full"}>
              <div className="relative w-36 rounded-lg min-w-36" >
                <Image
                  src={blog.thumbnail}
                  alt={blog.title}
                  fill
                    className="object-cover"
                />
              </div>
   
              <div className='px-2'>
                <div className='text-lg line-clamp-2'>{blog.title}</div>
                <div className="text-sm line-clamp-1">{blog.description}</div>
              </div>
            </Link>))}
        </div>
    </div>

  )
}

export default Course