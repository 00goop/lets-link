import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Users, UserPlus, Bell, User, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { User as UserEntity, Notification } from "@/entities/all";
import NavigatorChat from "../components/agents/NavigatorChat";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadUser();
    loadNotifications();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await UserEntity.me();
      setUser(currentUser);
    } catch (error) {
      console.log("User not authenticated");
    }
  };

  const loadNotifications = async () => {
    try {
      const currentUser = await UserEntity.me();
      const unreadNotifications = await Notification.filter({ 
        user_id: currentUser.id, 
        read: false 
      });
      setNotifications(unreadNotifications);
    } catch (error) {
      console.log("Could not load notifications");
    }
  };

  const navigationItems = [
    {
      title: "Home",
      url: createPageUrl("Dashboard"),
      icon: Home,
      key: "Dashboard"
    },
    {
      title: "Parties",
      url: createPageUrl("Parties"),
      icon: Calendar,
      key: "Parties"
    },
    {
      title: "Friends",
      url: createPageUrl("Friends"),
      icon: UserPlus,
      key: "Friends"
    },
    {
      title: "Notifications",
      url: createPageUrl("Notifications"),
      icon: Bell,
      key: "Notifications",
      badge: notifications.length
    },
    {
      title: "Profile",
      url: createPageUrl("Profile"),
      icon: User,
      key: "Profile"
    }
  ];

  const getCurrentIcon = (item) => {
    return location.pathname === item.url || currentPageName === item.key;
  };

  const UserAvatar = ({ size = "10" }) => (
    user?.profile_picture_url ? (
      <img
        src={user.profile_picture_url}
        alt={user.full_name}
        className={`w-${size} h-${size} rounded-full object-cover ring-2 ring-purple-500/20`}
      />
    ) : (
      <div className={`w-${size} h-${size} bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg`}>
        {user?.full_name?.[0]?.toUpperCase() || 'U'}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30">
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animated-gradient {
          background: linear-gradient(-45deg, #f8fafc, #faf5ff, #fdf4ff, #fce7f3);
          background-size: 400% 400%;
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-purple-100/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 md:pl-72">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center md:hidden shadow-lg shadow-purple-500/30">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="md:hidden">
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Let's Link</h1>
                <p className="text-xs text-gray-500">Connect & Explore</p>
              </div>
            </div>
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <UserAvatar />
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-8 md:ml-64">
        {children}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-purple-100/50 md:hidden z-40 shadow-lg">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item) => (
            <Link
              key={item.key}
              to={item.url}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-xl transition-all duration-300 ${
                getCurrentIcon(item)
                  ? "text-purple-600 scale-110"
                  : "text-gray-400 hover:text-purple-400"
              }`}
            >
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform duration-300`} />
                {item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-4 min-w-4 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-pink-500 to-rose-500 border-0 shadow-lg">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs mt-1 ${getCurrentIcon(item) ? "font-bold" : "font-medium"}`}>
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-white/80 backdrop-blur-xl border-r border-purple-100/50 z-30 shadow-xl">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Let's Link</h1>
              <p className="text-xs text-gray-500">Connect & Explore</p>
            </div>
          </div>
          <div className="space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.key}
                to={item.url}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  getCurrentIcon(item)
                    ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30"
                    : "text-gray-600 hover:bg-purple-50 hover:text-purple-600"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-semibold">{item.title}</span>
                {item.badge > 0 && (
                  <Badge className={`ml-auto h-5 min-w-5 p-0 flex items-center justify-center text-xs border-0 ${
                    getCurrentIcon(item) 
                      ? "bg-white text-purple-600" 
                      : "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md"
                  }`}>
                    {item.badge}
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </div>
      </nav>
      
      <NavigatorChat />
    </div>
  );
}