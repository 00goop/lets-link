import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "@/components/ui/button";
import { Copy, Zap, CheckCircle2, AlertCircle, Loader2, ChevronRight, Clock, Bot, User } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const FunctionDisplay = ({ toolCall }) => {
    // ... FunctionDisplay component from instructions, not needed for this agent but good practice
    return null;
};

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    
    return (
        <div className={cn("flex gap-3 my-4", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <Bot className="h-5 w-5 text-slate-600" />
                </div>
            )}
            <div className={cn("max-w-[85%]", isUser && "flex flex-col items-end")}>
                <div className={cn(
                    "rounded-2xl px-4 py-2.5",
                    isUser ? "bg-blue-600 text-white rounded-br-lg" : "bg-white border border-slate-200 rounded-bl-lg"
                )}>
                    {isUser ? (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                    ) : (
                        <ReactMarkdown 
                            className="text-sm prose prose-sm prose-slate max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                                a: ({ href, children }) => {
                                    if (href && !href.startsWith('http')) {
                                        return <Link to={createPageUrl(href)} className="text-blue-600 font-semibold hover:underline">{children}</Link>;
                                    }
                                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-semibold hover:underline">{children}</a>;
                                },
                                p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                                ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                                li: ({ children }) => <li className="my-0.5">{children}</li>,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    )}
                </div>
            </div>
            {isUser && (
                 <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center mt-0.5 flex-shrink-0">
                    <User className="h-5 w-5 text-slate-200" />
                </div>
            )}
        </div>
    );
}