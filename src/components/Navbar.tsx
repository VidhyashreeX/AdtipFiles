
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useState } from "react";
import { 
  Home, 
  Video, 
  User, 
  Search, 
  Wallet, 
  Plus,
  Bell,
  MessageSquare,
  PhoneCall
} from "lucide-react";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <>
      {/* Desktop Navbar - Made sticky */}
      <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-white shadow-sm sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <Link to="/home" className="flex items-center">
            <img src="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxMQEhASEhASEBEXFREVFRIQFRAQERUTFRUXGBUSFhcYHCggGBslGxcVITUjJSorLi4uFyEzODMsNygwLisBCgoKDg0OGhAQGjclICU1NS0rMjEtNy0yLzAtNS0tLS8uNS0vLS0tNjctKy0tLS0yLS0tLy0tLS8uLTAvLSstLf/AABEIAOEA4QMBEQACEQEDEQH/xAAcAAEAAgMBAQEAAAAAAAAAAAAAAwYEBQcCAQj/xABDEAACAQEDBggMBAYCAwAAAAAAAQIDBBExBQYSIVFhM0FScYGRsdEHExYiMkJyc5KhssJiweHwIzRTY3SzFKIVgtL/xAAcAQEAAQUBAQAAAAAAAAAAAAAAAwEEBQYHAgj/xABDEQACAQICBQgIBAMIAgMAAAAAAQIDBBExBQYhQXESUWGBkbHB0RMiMjM0cqHwBxZCUhQjNWKCkrLC0uHxJaIVJIP/2gAMAwEAAhEDEQA/AO4gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGLbso0qCvqTUdixk+ZLWyqTeRbXN5RtljVlh39mZqZZ32f+496ivzZ69GzFvWG0T39n/J88sLPsq/Cu8ejZT8xWnNLsXmPLCz7KvwrvHo2PzFac0uxeY8sLPsq/Cu8ejY/MVpzS7F5jyws+yr8K7x6Nj8xWnNLsXmPLCz7KvwrvHo2PzFac0uxeY8sLPsq/Cu8ejY/MVpzS7F5jyws+yr8K7x6Nj8xWnNLsXmPLCz7KvwrvHo2PzFac0uxeY8sLPsq/Cu8ejY/MVpzS7F5jyws+yr8K7x6Nj8xWnNLsXmPLCz7KvwrvHo2PzFac0uxeY8sLPsq/Cu8ejY/MVpzS7F5jyws+yr8K7x6Nj8xWnNLsXmPLCz7KvwrvHo2PzFac0uxeY8sLPsq/Cu8ejY/MVpzS7F5jyws+yr8K7x6Nj8xWnNLsXmPLCz7KvwrvHo2PzFac0uxeY8sLPsq/Cu8ejY/MVpzS7F5mRZc57NN3abg/wC4nFdeCKODJ6OnLOo8OVhxWH1yNwnfrWtHkyyeO1H0FQAAAAAAAYeVrcrPSnUeu5altk9SRVLF4Fpe3StqEqr3ZcdxzO12mVWTnOTlJ8b7FsRcJYHOq9edabqVHi2RFSEAAAAAAAAAFCqTbwRjVrdShfpVIJrivTfUtZBK5oxzkZ211Y0vdLGlbSw52uSu2WBjvLdD+p/1n3ET0hRW/wChmYfh7pyWdNLjNeDYWW6H9T/rPuKLSFF7/oJ/h7pyK2U0+E144GTQttOfo1Iyey9X9WJPC4pT9mRgr3V3SlknK4t5JLfhiu1Yr6mQTmFAAAAAAAAAABZszsruM1Qm24S9C/1ZbFufaRTjvNk0DpCUKit5v1Xl0P8A57+su5EbkAAAAAAACtZ9v+DTX9xfTIkp5mu6yP8A+vH5vBlHJjSwAAAAAAARWi0RprSnJRW/8lxkdSrCmsZPAyGjtFXmkavorWm5vfhkuLyXWzSWzOPFUof+0/yiv3uMZV0k8qa62dR0R+GUFhPSNTF/thl1ye19SXFmltNtqVPTnKW7CPUtRjqladT2nidH0foWw0esLWjGHSlt629r62QEZkwAAAAZtlyrVp4T0lsn5y70XFK6q08ma3pTVPRWkcXVpJSf6o+q+vDY+tM3diy/CWqa8W9uMeviMlR0jCWyezuOZaZ/De8tsallL0sebKXlL6PmRt4TTSad6eFxkU01ijnVWjUozcKkXGSzTWDXFM9FSIAAAAAAyMnO6rSa5cPqR5lkXFo8K8Gudd51UtzpwAAAAAAAKzn5wNP3n2yJKeZrusnw8Pm8GUgmNLAAAAAKFUsTS5Ty7GF8ad05crGC738jG3OkFH1ae18507Vv8Patyo3GkcYQzUMpP5v2ro9rgVyvXlUelOTk9r7FsRiJzlN4yeLOxWdlb2dJUbeChFbksP8At9L2kZ5LoAAAAAAAAAAGVYcoTovzX5vHF+i+4mo3E6T9VmC01q7Y6Xp8m4h626S2SXXvXQ8UWfJ2U41VslxxeK70Zy3uoVlsz5jhOsWq13oap6/rU37M0tj6H+19HY3gzPRdGsH0FAAACewcLS9uH1Io8ie199Diu86sWx08AAAAAAAFZz84Gn7z7ZElPM13WT4eHzeDKQTGlgAAHwo3geoxlKSjFYt7Eis5ayzp306buhhKSxluW7tMJd3jqepDLvO56nalQsIxvL1Y1s0t0POXTu3c5pTHnRgAAAAAAAT0rM3j1cZf0LGU1ypbEaLpvXe3s5ujbR9JNZvH1V/u6sF0mVTyffdq7S+jY0VuxNGudetK1H6s1HojFeOL+pkLJm4k/hKP7TGy1t0q3j/ESIK2RL8JTg9zvXVK8pKzpPcXVvrvpSm/Wq8pdOH33mlttCtQfnNSi8JXanud2DLKrawg9qN80PrNVv4N054yWcWliuzDFdPaebPlCUWndc1g49zLf0PJfKhLaZypexuaUqF3SUoy2P8A6fnitxdMi5WjWjj5y9JbHt5jMW9b0kdue84frLoH/wCMuP5bxpS2xe/5X0rsa286W2TLk1g+goACewcLS9uH1Io8ie199Diu86sWx08AAAAAAAFZz84Gn7z7ZElPM13WT4eHzeDKQTGlgAAGizltzilSi7m1fJrk8Uen94mK0jcNfy11nWfw41fhUb0nWWOD5NNdO+XVkunHekVsxB2IAAAAAAAE9mpX6+rvL+xt+W+XLJGha6awO0pfwdB4TkvWf7Y83F/RcUzeWCxX62ZpI4pWr4G3p2ZLiPRYyqNkiprYDxymHTWwDlMw7fk+NSMotYrqfEyOrTU4OJldD6UnYXcLhbntXOt67PqUidmuvT1Nanzmu+kaPpRWtOcVKLxT2olyfN0qiksMHzP93k1G55E0zD6b0BG/s50MNuceiSy8n0Mu9jraSNgTxPnSvScJNNbTKKluACewcLS9uH1Io8ie199Diu86sWx08AAAAAAAFZz84Gn7z7ZElPM13WT4eHzeDKQTGlgAAFPzhi1XnfxqDXNopfkzXr5YV5fe4+i9Q5xloGhhu5SfHlyNcWhuAAAAAAB6pwvdxJSpupNRRj9KaQp6PtZ3NTKK2Lne5db8zcZPs17Wo2OnBRiorJHzrpG+qXNadaq8ZSeL++bcuZFioU9FEhgZyxZKVPAAAB8AKZlqjoVqi4m9L4le/nea3dw5NaS+9p9L6o3f8Voa3m81Hkv+76vgYRbmyFiyNXvUea7q1GxWkuVRiz511wtFb6Wrwjljyv8AElLxN8i6NPPoKE9g4Wl7cPqRR5E9r76HFd51Ytjp4AAAAAAAKzn5wNP3n2yJKeZrusnw8Pm8GUgmNLAAAK/nRZb9GouJaMua/U/m+tGI0lSyqLgzr34ZaXilU0fN7ceXDpyUl9E8OLK8Yo66AAAAAAZtio4bX2GZsKHJjy3m+445rzptXNx/CU36lPPplv7MuOJZcn0LkZJHMK9TFmeVLYAAAAAAq2dEf4sXtgu1mC0isKuPQd5/DSry9ESj+2bXaovxNOWB0I3OR3qj09rM7Ye5RwnX5f8AlqnCPcizU8EXxzyWZ6KnknsHC0vbh9SKPIntffQ4rvOrFsdPAAAAAAABWc/OBp+8+2RJTzNd1k+Hh83gykExpYAABHXpqUWmr01c0eZRUlg8i5tLqra1o1qMsJReKfSVDKOTpUm2tcNvGufvMBc2kqTxW1feZ9Bas63W2lqap1GoVt8d0umPPwzXStpglobgAAAS0Kd73F3aW/pZYvJfeBqutWn1oy25FN/zZ+z0LfLy53wZvsm2a/WZ5I4Fc1sTeQjcj0YxvFnoqUAAAAAAKvnS/wCLBfgXzkzB6SeNVcPM7t+GdNx0TOT31H/lijTGPOim3yRhHp7WZ2w9yjhWv39Wnwj3FnpYIvjncsz2VPJPYOFpe3D6kUeRPa++hxXedWLY6eAAAAAAACs5+cDT959siSnma7rJ8PD5vBlIJjSwAAAAQV6CkUaxJadVwaaZo7bkha2lc92HUWFWwpz2x2HQdD6/39olCt/Nj/a9r/F5pmsq5Pktj+TLCej6qy2m/Wmv2iq0canKg+lY9jjj3I8Rsj4/ke6ej5t+vsRb6Q1/s6cGrSLnLc2sI+b4YLibOx2O+7VcjLU6cYR5Mcjk2ktJVbutKtWljJ/eC5lzI39mo6KJTA1J8pk5UiAAAAAABRvA9Ri5NRisW8ik5WtXjas5L0cI8y1X9OPSa1cVfSVHI+nNWtFvRmjKNtL2ksZfM9r7G8OoxCEzpt8kYR6e1mdsPco4Vr9/Vp8I9yLPSwRfHO5ZnsqeSewcLS9uH1Io8ie199Diu86sWx08AAAAAAAFZz84Gn7z7ZElPM13WT4eHzeDKQTGlgAAAAAHmUUwVTaIKlkTKYEsarRErAhge/4hmRSoKIIpTbJSpGfQBcACjaWZ7hCU3hFY8CKpaYR9KcI88oojlXpxzku0yVDQekq/ureb/uPvwwMOtlujG/z3Jrigm/m9XzLed/Rjk8TYLP8AD/TVw1yqaprnlJd0eU/oabKeXJVU4QWhB48qS2bkY64vpVVyVsR0rVvUS20VUVxWl6SqstmEY9KW99L6kmagsTfAAbfJGEentZnbD3KOFa/f1afCPciz0sEXxzuWZ7KnknsHC0vbh9SKPIntffQ4rvOrFsdPAAAAAAABWc/OBp+8+2RJTzNd1k+Hh83gykExpYAAAAAAAMO15TpUr9Kav5MfOlzasOktat3Sp5vsNn0XqfpbSKUqVLkxf6peqvrtfUmaytnKvUpt75u75LvLKek/2x7TeLL8Llhjd3HVBeMv9pg1c4KzwcYezH/6vLaV/We/DqNlt/w90JS9qEp/NJ/6eSQVMrV5Y1ZL2bo9hE7qs/1My1LVTQtL2bWHWuV/mxIf+dV/q1Pjl3nl16r/AFPtLyOgtFx9m1pr/wDOPkfJWyo8ak3zyl3nh1JPNlzDR1pD2aMVwivIilJvFt8+s84l1GEY+ysD4D0AAAAAAbfJGEentZnbD3KOFa/f1afCPciz0sEXxzuWZ7KnknsHC0vbh9SKPIntffQ4rvOrFsdPAAAAAAABWc/OBp+8+2RJTzNd1k+Hh83gykExpYAAAAPFarGEXKTUYrFs8TmoRcpZF1ZWVa9rwt6EeVOTwS+9yW1vctpVcpZanVvUb4Q16l6TX4n+XaYK4vZ1Xgti+8zvmrmpNnouKqVkqlb9zWyL/sp/5ntfRkasszdQAeqcHJqKV7bSS2t6kgliUlJRTbyR1Sy+Cyj4pKpXq+Oa1yhoKnGWxRava6dd3EZWOj48na9po1XWyt6XGnBcjpxxfXu7NnSULOXNqvYJ3VY3wbuhVjrhLdud3E/mWFahOk9ptOj9KUL6GNN7d6ea810mmITIgAAAAAAAAG3yRhHp7WZ2w9yjhWv39Wnwj3Is9LBF8c7lmeyp5J7BwtL24fUijyJ7X30OK7zqxbHTwAAAAAAAVnPzgafvPtkSU8zXdZPh4fN4MpBMaWAAAACsZyW7Sl4pPzY+lvl+nbeYPSFflz5CyXed1/DzQEbSz/jqq/mVfZ6Ibv8AFnw5JpTHnRgAADJybqq0pPVGNSm5S4orSWtviPUPaTILjbSlFZtPDsP0Z46LjpqSlC7SUovSTjdfemsdRsWKwxOQ8iSlyGtuRjp0bXS9SvRmt04SXf8ANM8+rUjzpk3861q74zj1Nff1OYZ3eDudHSq2TSq0tbdLGrBfh5cfnz4mMuLJx9aG1G66K1jhWwp3Pqy59z48z+nDIoJYG1AAAAAAAA2+SMI9PazO2HuUcK1+/q0+Ee5FnpYIvjncsz2VPJPYOFpe3D6kUeRPa++hxXedWLY6eAAAAAAACs5+cDT959siSnma7rJ8PD5vBlIJjSwAACO0VdCMpvCKb6lgR1Z8iDlzF/ouyd9eUrZfrkl1N7X1LFlDnNybbd7bbb2t4s1dvF4s+qadONOChBYJLBLoWR8B7AAAOt+CahGdhrxnGM4yr1FKMkmpLxVLU08VrZlrBJ0mnz+RoOtE5QvoSi8GorDo2yMy1ZHtFgU5WG+tZmpadim23HSxlQk9e/R58dV3uVKdLF09q5vIt6V7b3zjG79WosprfhukvHuOZZu5x2jJ9R+Lfm3/AMSjO/Qk1qd69WW9a9XQYylXnSezsN0v9G29/D1890lmvNdB2PNnOihb4305aNRLzqM7tOO9cqO9dNxmKNxCqtmfMc90joqvYywmsY7msn5PoNVnfmJStmlVpXUbRr14U6j/ABpYP8S6byK4tI1NsdjL7RWn6tphTqetD6rh5dmByLKmTatlqOlWpunNcTwa5UXg1vRiJwlB4SRv1tdUrmmqlKWK+8+YxDyXAAAAANvkjCPT2szth7lHCtfv6tPhHuRZ6WCL453LM9lTyT2DhaXtw+pFHkT2vvocV3nVi2OngAAAAAAArOfnA0/efbIkp5mu6yfDw+bwZSCY0sAAA1mcVS6hJcpxXzv/ACLHSEsKOHOb1+Hdsq2mozf6Iyl/p/1FRMCfQIAAAAOv+B/+Sq/5FT/XSMvo/wB2+Pkc/wBa/jI/Ku+ReS+NYKvnZmVRtyc43UbR/UitUt1RcfPjz4FrXtY1Nq2Mzei9OVrJqD9aHNzcObhkcjyhk605PrJTUqNWLvhUg3c7vWhJYrv1mInCdKW3YzfqFzbX9FuOEovNPua++g6Hmh4RI1dGjbGqdTBVtUac3+Pig9+HMZG3vVL1amfOalpXVuVLGra7Y/t3rhz9/EuGWsjUbbT8XWgprGMlqnF8qMuLse8vKlKNRYSNfs72vZ1OXSeD3rc+ho41nfmlUyfJNvxlCTahUWp33X6M1xSx3O7oWGuLeVJ9B0PRWmKV/HBLCazXiujuK6W5mAAADb5Iwj09rM7Ye5RwrX7+rT4R7kWelgi+OdyzPZU8k9g4Wl7cPqRR5E9r76HFd51Ytjp4AAAAAAAKzn5wNP3n2yJKeZrusnw8Pm8GUgmNLAAANXnHC+g3slF/O78yw0isaPWb9+HFZQ0zyX+qEl3S/wBJUjBHfQAAAAdf8D/8lV/yKn+ukZfR/u3x8jn+tfxkflXfIvJfGsEdorxpxlOclCEVfKUmlFLa2yjaSxZ7hTlUkowWLeSRyDwhZ4U7co0aML6UJ6fjZJqUpXNeauKOvj1vVhcYi7uVV9WOR0DQOhqlm3Vqv1msMFu37ed/RdJpc2c169vldTWjTTSnWnfoR2pcqV3Eum4go286r2ZGR0jpWhYxxm8Zbks35Lp7ztuQslRslGFGM5zUfWqScn0clblqM3SpqnHko5te3crqs6skk3zL7x4lD8KucNGdONkpyVSoqilUcdcYaKktG/lXvouZYX1aLXIRtGrOjq0KjuaiwWGC6ccNvDYczMaboAAAbfJGEentZnbD3KOFa/f1afCPciz0sEXxzuWZ7KnknsHC0vbh9SKPIntffQ4rvOrFsdPAAAAAAABWc/OBp+8+2RJTzNd1k+Hh83gykExpYAABBbaHjKc4bU0r9vE+u4hr0/SU3Ey2gtIf/H6Ro3W6MljweyX/AKtlFau1PUzWT6kjJSSayYBUAAA6/wCB/wDkqv8AkVP9dIy+j/dvj5HP9a/jI/Ku+RY8v5wUbHFeMblUl6FGmtKrN7lxLe9Rc1a0aa258xh7HR1a8l6myKzk9iX3zHGs5s6a9vl570aafmUYX6C2N8qW99Fxhq1xOq9uXMdE0doqhYx9TbLfJ5/8Lo7cSyZoeDqVXRq2xOnT1ONHXGpL2+Qt2PMXNvZOXrVMuYw+ldZI08aVrtlvluXDn7uJ0yrUo2Sle3ChRgt0IRXEktu7FmSbjTjzJGmRjWuquCxlOXW2cszv8IVS0aVKy6VGjrTqYVai+yPzfyMXcXjn6sNiN40Vq7ToYVLj1pc25eb+neUUsTZwAAAAbfJGEentZnbD3KOE6+v/AMtU4R7kWelgi+OeSzPZU8k9g4Wl7cPqRR5E9r76HFd51Ytjp4AAAAAAAKzn5wNP3n2yJKeZrusnw8Pm8GUgmNLAAAPgBVc4bFoT016Mnr3S4+vHrMFf0ORPlrJ953rUDT6vbL+Dqv8AmUlgumG59Xsvq5zUlgdBAAALVmnnbWslKVmpQp6VSqnGpO96EpqMG9H1tUV+uBdULmVOPIjvMHpTQ9G6qq4qt4RW1Leli892f/R0/JObMLOqlSUnaLXOMlO0VfSbauuivUjuXEZOFBRTb2ye80m60pOu4wiuRTi9kVl187MHNDMelYtGpUurWm7036EHspp8f4nr5jxb2kae17WXWldO1bzGnD1Yc298fLLiZ+dGddCwR896dZq+NGLWm9jlyY730Xkle4hSW3PmLXRuia99L1VhHfJ5dXO+jtwOOZxZx17dPSqy81PzKUdVOHMuN73rMNVrzqvGR0Kw0bQsocmktu97398xqCIyAAAAAABuslQuuX7v4zYrWHIpRR87613cbrSderHLHBcIpR8Cy08EXJp0sz0VPJPYOFpe3D6kUeRPa++hxXedWLY6eAAAAAAACs5+cDT959siSnma7rJ8PD5vBlIJjSwAAAAQWugpxcWr08SOpTjUi4yyL/RukK9hcwuKDwlHLxT6HkynW6xypSueHE9v6mvXFvKjLB5bj6N1f1gt9MWyqU9k17Ud8X4p7n44oxiAz4AJrFVUKlObwjOEndsTTKxeDTI60HOnKK3po/RtntUKkFUhNSpyWkpprRu23mxRkmsUcgnSnTm6clhJbMDn+d/hGjDSpWNqc9adfGEfdr1nvw5ywuL1L1afabXorVuU8Kt3sW6O98ebhnwOX2ivKpKU5yc5yd7lJuUm9rbMY228WbrCEacVGCwSySPBQ9gAAAAAEtnp3vd+Zd2lu6s8XkvvA1XWvT0dG2rhB/zZrCPQt8urdzvgyw5LoYGfR8/3MzdI9GPPoKE9g4Wl7cPqRR5E9r76HFd51Ytjp4AAAAAAAKzn5wNP3n2yJKeZrusnw8Pm8GUgmNLAAAAAAMS2WRTTTV6I6lONSPJkjI6N0ncWFdV7eXJkvvB866CsW3JkoPzfOXz/AFMLcWM6e2O1HcdX9eLTSCVO5ap1On2Xwe7g+pswCxN5ABJG0TUXBTkoPGKk1F86wK4vDA8OnBy5TSx58CMoewAAAAAAChNSs7ePVx/oX1vZSntlsX1NK07rpbWSdK1aqVP/AFXF7+C62ja2Kx33atRmYU4wXJithxrSGkatzVlVrS5Unm397OhZI39no6KJDB1J8pk5UjABPYOFpe3D6kUeRPa++hxXedWLY6eAAAAAAACv57UHKzqS9ScW+ZprtaPdN7TBaw0nO1Ul+lpv6rxKETmjAAAAAAAAhq0FIoSRm0ai25KTvd2vatTLWtaU6m1rabbofW/SOjkoU58qC/TLaureuppGqrZMksH16jH1NHTXsvE6JYfiNZ1Ulc03B869ZeDXYzFlZpr1eq5lrK1qxzibTb6zaJr+xcR63yf82B58VLky6mROnJZoyUL+1n7NWL/vLzPnipcl9THIlzFZX1tHOpFf3l5n1UpbH06u09qhVeUX2FpV05o2n7VxD/En3M9KzS3L97iaNlWe7AxVxrpoijlUcn/Zi/HBfUlhYm8b+jUXENGv9Uuw1y8/EWC2W1Hrk/Bf7jMoWHYri+pWtOnkjR9Ka0X9/jGtU9X9q2L6Z9eJsrNk4ucDWalwbOjQUSpZym2TFSMAAAzci0HUr0Yrlxb5k72+pM8yewvNH0nVuacVzr6bX9DqBbnSgAAAAAAAeKtNSTjJXxaaaeDTxQPM4RnFxksU8yh5ZzZqUm3Ti6tPi0VfOO5rj518iaM08zR7/QlahJypLlR6M1xXj3GjlSktTi096aPZhXCSeDR80HsfUwUwY0HsfUwMGNB7H1MDBjQex9TAwY0HsfUwMGHTex9TBXBkNSyX8T6ge4zkjGqZMv4n1FMCaNaRBLJb5L6mMCVV2eP/ABT5L6hgV/iGelkp8l9TGBR3DJYZLfJfUMDw67JoZOu4n1AjdaTJ4WW71X1FSJykyVQex9TB5wY0HsfUwUwY0HsfUwMGNB7H1MDBmRZcn1aruhTnLmTu6Xgg2kXFG0r1nhTg31eOReM28g/8ZOc2pVZK7VhFbFte/wDbhlLE3PROiv4ROc9s39Fzef3jvDwZoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/9k=" alt="AdTip Logo" className="h-8 w-8 mr-2" />
            <span className="text-2xl font-bold text-adtip-teal">AdTip</span>
          </Link>
        </div>
        
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users or content..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/home" 
            className={`flex flex-col items-center ${isActive("/home") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Home className="h-6 w-6" />
          </Link>
          <Link 
            to="/tiptube" 
            className={`flex flex-col items-center ${isActive("/tiptube") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Video className="h-6 w-6" />
          </Link>
          <Link 
            to="/tipcall" 
            className={`flex flex-col items-center ${isActive("/tipcall") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <PhoneCall className="h-6 w-6" />
          </Link>
          <Link
            to="/create-post"
            className="flex items-center justify-center h-10 w-10 rounded-full teal-gradient text-white"
          >
            <Plus className="h-6 w-6" />
          </Link>
          <Link 
            to="/wallet" 
            className={`flex items-center ${isActive("/wallet") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Wallet className="h-6 w-6 mr-1" />
            <span className="font-medium">₹{user?.wallet || '0'}</span>
          </Link>
          <Link 
            to="/notifications" 
            className="text-gray-500"
          >
            <Bell className="h-6 w-6" />
          </Link>
          <Link to="/profile" className="flex items-center">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
          </Link>
        </div>
      </nav>
      
      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-gray-200 z-20">
        <div className="flex justify-around items-center px-2 py-3">
          <Link 
            to="/home" 
            className={`flex flex-col items-center ${isActive("/home") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </Link>
          <Link 
            to="/tiptube" 
            className={`flex flex-col items-center ${isActive("/tiptube") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <Video className="h-6 w-6" />
            <span className="text-xs mt-1">TipTube</span>
          </Link>
          <Link
            to="/create-post"
            className="flex flex-col items-center justify-center"
          >
            <div className="h-12 w-12 rounded-full teal-gradient flex items-center justify-center">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </Link>
          <Link 
            to="/tipcall" 
            className={`flex flex-col items-center ${isActive("/tipcall") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <PhoneCall className="h-6 w-6" />
            <span className="text-xs mt-1">TipCall</span>
          </Link>
          <Link 
            to="/profile" 
            className={`flex flex-col items-center ${isActive("/profile") ? "text-adtip-teal" : "text-gray-500"}`}
          >
            <User className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </Link>
        </div>
      </nav>
      
      {/* Mobile Top Search Bar - Make sticky below desktop navbar */}
      <div className="md:hidden sticky top-0 z-20 bg-white p-4 shadow-sm">
        <div className="flex items-center">
          <Link to="/home" className="flex items-center mr-3">
            <img src="/logo.svg" alt="AdTip Logo" className="h-6 w-6 mr-1" />
            <span className="text-lg font-bold text-adtip-teal">AdTip</span>
          </Link>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search..."
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:border-adtip-teal text-sm"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          </div>
          <Link to="/wallet" className="ml-3 flex items-center text-gray-700">
            <Wallet className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </>
  );
};

export default Navbar;
