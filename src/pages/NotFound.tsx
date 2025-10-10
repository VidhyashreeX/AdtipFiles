
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-20 h-20 rounded-full teal-gradient flex items-center justify-center mb-6">
        <Search className="h-10 w-10 text-white" />
      </div>
      
      <h1 className="text-3xl font-bold mb-2 text-foreground">Page not found</h1>
      
      <p className="text-muted-foreground mb-8 max-w-md">
        Oops! It looks like the page you're looking for doesn't exist or has been moved.
      </p>
      
      <div className="space-y-4">
        <Link to="/home">
          <Button className="teal-button w-full md:w-auto">
            Go to Home
          </Button>
        </Link>
        
        <div className="text-sm text-muted-foreground">
          <p>
            or <Link to="/watch" className="text-adtip-teal hover:text-adtip-teal/80">explore TipTube</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
