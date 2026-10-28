import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { cn } from '@/modals/utils';

interface IBlogCard {
    title: string;
    image: string;
    slug: string;
    date?: string;
    price?: number;
    description?: string | React.ReactNode;
    component?: React.ReactNode;
    imageClass?: string;
    className?: string;
    className2?: string;
}

export const BlogCard: React.FC<IBlogCard> = ({
    title,
    image,
    slug,
    date,
    description,
    component,
    className,
    className2,
    imageClass,
}) => {
    return (
        <Card className={cn('overflow-hidden', className)}>
            <div className="relative w-full h-0 pb-[56.25%]">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className={cn('object-cover', imageClass)}
                />
            </div>
            <div className={cn('p-6', className2)}>
                <h2 className="text-xl font-bold border-b">{title}</h2>
                {description && typeof description === 'string' ? (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : (
                    description
                )}
                {component ? (
                    component
                ) : (
                    <div className="flex justify-between items-center mt-4">
                        {date && (
                            <span className="text-sm text-muted-foreground">
                                {new Date(date).toLocaleDateString()}
                            </span>
                        )}
                        <Link href={slug}>
                            <Button variant="secondary">Read More</Button>
                        </Link>
                    </div>
                )}
            </div>
        </Card>
    );
};

export const CourseCard: React.FC<IBlogCard> = ({
    title,
    image,
    slug,
    price,
    description,
}) => {
    return (
        <Card className="overflow-hidden  rounded-lg">
            <div className="relative w-full h-0 pb-[56.25%]">
                <Image src={image} alt={title} fill className="object-cover" />
            </div>
            <div className="p-6">
                <h2 className="text-lg font-bold line-clamp-2">{title}</h2>
                {description && (
                    <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                        {description}
                    </p>
                )}
                <div className="flex justify-between items-center mt-4">
                    <span className="text-sm font-medium">
                        {price === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                        ) : (
                            <>₹{price}</>
                        )}
                    </span>
                    <Link href={slug}>
                        <Button variant="secondary">Enroll Now</Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
};
