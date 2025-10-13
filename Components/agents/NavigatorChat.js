
import React, { useState, useEffect, useRef } from 'react';
import { agentSDK } from "@/agents";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, MessageCircle, X, Send, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import { AnimatePresence, motion } from 'framer-motion';

export default function NavigatorChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        const initializeConversation = async () => {
            let convId = localStorage.getItem('navigatorConversationId');
            let conv;

            if (convId) {
                try {
                    conv = await agentSDK.getConversation(convId);
                } catch (e) {
                    convId = null; 
                }
            }
            
            if (!convId) {
                conv = await agentSDK.createConversation({ agent_name: "navigator" });
                localStorage.setItem('navigatorConversationId', conv.id);
            }

            setConversation(conv);
            setMessages(conv.messages || []);
        };
        initializeConversation();
    }, []);

    useEffect(() => {
        if (!conversation) return;

        const unsubscribe = agentSDK.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages);
            setIsLoading(data.status !== 'completed' && data.status !== 'failed');
        });

        return () => unsubscribe();
    }, [conversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        const tempId = Date.now().toString();
        setMessages(prev => [...prev, { id: tempId, role: 'user', content: inputValue }]);
        setInputValue("");
        setIsLoading(true);

        await agentSDK.addMessage(conversation, {
            role: "user",
            content: inputValue
        });
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50 md:bottom-6 md:right-6 mb-20 md:mb-0">
                <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="w-16 h-16 rounded-full shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <AnimatePresence>
                        {isOpen ? <X className="w-8 h-8" /> : <Bot className="w-8 h-8" />}
                    </AnimatePresence>
                </Button>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-24 right-6 z-50 md:bottom-24 md:right-6 mb-20 md:mb-0"
                    >
                        <Card className="w-96 h-[60vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-100 border-b">
                                <CardTitle className="flex items-center gap-2 text-slate-800">
                                    <Bot />
                                    App Navigator
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4">
                                {messages.map((msg, index) => (
                                    <MessageBubble key={msg.id || index} message={msg} />
                                ))}
                                {isLoading && messages[messages.length - 1]?.role === 'user' && (
                                    <div className="flex justify-start">
                                        <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>
                            <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
                                <div className="relative">
                                    <Input
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        placeholder="Ask me where to go..."
                                        disabled={isLoading}
                                    />
                                    <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading || !inputValue.trim()}>
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
