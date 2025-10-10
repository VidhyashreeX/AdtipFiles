import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Follow = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-20 md:pb-0 bg-background min-h-screen">
      {/* Header */}
      <div className="bg-card p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold ml-4 text-foreground">Follow</h1>
        </div>
      </div>

      <div className="max-w-screen-md mx-auto p-4 space-y-6">
        <div className="text-center mb-8">
          <div className="h-20 w-20 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-teal-600 dark:text-teal-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-foreground">Follow Creators</h2>
          <p className="text-muted-foreground">
            Discover and follow your favorite creators to see their content in your feed
          </p>
        </div>

        {/* Coming Soon Message */}
        <div className="text-center py-12">
          <div className="mb-6">
            <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Coming Soon</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              We're working on an amazing follow system to help you discover and connect with creators. Stay tuned!
            </p>
          </div>
          
          <div className="space-y-4">
            <Button 
              className="teal-button"
              onClick={() => navigate("/home")}
            >
              Explore Content
            </Button>
            
            <div className="text-sm text-muted-foreground">
              <p>
                or <button 
                  onClick={() => navigate("/watch")}
                  className="text-adtip-teal hover:text-adtip-teal/80 underline"
                >
                  watch videos on TipTube
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Follow;