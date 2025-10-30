
        feather.replace();
        
        // Mobile menu toggle
        const menuBtn = document.getElementById('menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const menuOverlay = document.getElementById('menu-overlay');
        let menuOpen = false;
        
        menuBtn.addEventListener('click', function() {
            menuOpen = !menuOpen;
            
            if (menuOpen) {
                mobileMenu.classList.add('open');
                menuOverlay.classList.add('open');
                menuBtn.classList.add('open');
                document.body.style.overflow = 'hidden';
            } else {
                mobileMenu.classList.remove('open');
                menuOverlay.classList.remove('open');
                menuBtn.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
        
        menuOverlay.addEventListener('click', function() {
            mobileMenu.classList.remove('open');
            menuOverlay.classList.remove('open');
            menuBtn.classList.remove('open');
            menuOpen = false;
            document.body.style.overflow = '';
        });
        
        // Close menu when clicking on a link
        const menuLinks = mobileMenu.querySelectorAll('a');
        menuLinks.forEach(link => {
            link.addEventListener('click', function() {
                mobileMenu.classList.remove('open');
                menuOverlay.classList.remove('open');
                menuBtn.classList.remove('open');
                menuOpen = false;
                document.body.style.overflow = '';
            });
        });
        
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
   