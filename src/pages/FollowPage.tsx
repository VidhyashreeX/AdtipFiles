
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Search, CheckCheck, UserPlus, Bell, BellOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const FollowPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for creators and followers
  const creators = [
    {
      id: 1,
      name: "Alex Morgan",
      username: "@alexmorgan",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=764&auto=format&fit=crop",
      followers: 2345,
      following: false
    },
    {
      id: 2,
      name: "Jessica Lee",
      username: "@jesslee",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=688&auto=format&fit=crop",
      followers: 5678,
      following: true
    },
    {
      id: 3,
      name: "Marcus Chen",
      username: "@mchen",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=687&auto=format&fit=crop",
      followers: 9823,
      following: false
    },
    {
      id: 4,
      name: "Sophia Wilson",
      username: "@sophiaw",
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=764&auto=format&fit=crop",
      followers: 7654,
      following: true
    },
  ];
  
  const followers = [
    {
      id: 5,
      name: "Thomas Wright",
      username: "@thomasw",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=687&auto=format&fit=crop",
      following: true
    },
    {
      id: 6,
      name: "Olivia Johnson",
      username: "@oliviaj",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=761&auto=format&fit=crop",
      following: false
    },
    {
      id: 7,
      name: "Daniel Smith",
      username: "@dansmith",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=687&auto=format&fit=crop",
      following: true
    },
  ];
  
  const handleFollow = (id: number, isFollowing: boolean) => {
    toast({
      description: isFollowing 
        ? "You have unfollowed this user" 
        : "You are now following this user",
    });
  };
  
  const handleNotification = (id: number, isNotified: boolean) => {
    toast({
      description: isNotified 
        ? "Notifications turned off for this user" 
        : "You will now receive notifications from this user",
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          className="pl-0"
          onClick={() => navigate("/home")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold ml-2">Follow</h1>
      </div>
      
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search users"
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="discover" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
        </TabsList>
        
        <TabsContent value="discover">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Creators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creators.map((creator) => (
                    <div key={creator.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{creator.name}</h3>
                          <p className="text-sm text-gray-500">{creator.username}</p>
                        </div>
                      </div>
                      <Button
                        variant={creator.following ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollow(creator.id, creator.following)}
                      >
                        {creator.following ? (
                          <>
                            <CheckCheck className="mr-1 h-4 w-4" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-1 h-4 w-4" /> Follow
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested For You</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {creators.slice(1, 3).map((creator) => (
                    <div key={creator.id + 10} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={creator.avatar} alt={creator.name} />
                          <AvatarFallback>{creator.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{creator.name}</h3>
                          <p className="text-sm text-gray-500">{creator.username}</p>
                        </div>
                      </div>
                      <Button
                        variant={creator.following ? "outline" : "default"}
                        size="sm"
                        onClick={() => handleFollow(creator.id + 10, creator.following)}
                      >
                        {creator.following ? (
                          <>
                            <CheckCheck className="mr-1 h-4 w-4" /> Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-1 h-4 w-4" /> Follow
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="following">
          <div className="space-y-4">
            {followers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={follower.avatar} alt={follower.name} />
                    <AvatarFallback>{follower.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">{follower.name}</h3>
                    <p className="text-sm text-gray-500">{follower.username}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotification(follower.id, follower.following)}
                  >
                    {follower.following ? (
                      <Bell className="h-4 w-4 text-teal-500" />
                    ) : (
                      <BellOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFollow(follower.id, true)}
                  >
                    Unfollow
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FollowPage;
