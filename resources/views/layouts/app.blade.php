<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="konCHO">
  <meta name="theme-color" content="#060e24" id="themeMetaColor">
  <meta name="format-detection" content="telephone=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="csrf-token" content="{{ csrf_token() }}">

  <title>{{ $title ?? 'konCHO - Konsolidasi Complaint Handling Officer (Mobile, Fixed, eCare, Priority)' }}</title>

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="{{ asset('assets/images/logo_clean_navy.png') }}">

  <!-- Google Fonts: Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  <script id="tailwind-config">
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              navy: '#061345',
              darknavy: '#060e24',
              midnavy: '#0b1a3d',
              accent: '#0284c7',
              sky: '#38bdf8',
              gold: '#fbbf24',
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
          }
        }
      }
    };
  </script>

  <!-- Modern Navy Stylesheet -->
  <link rel="stylesheet" href="{{ asset('css/theme-navy.css') }}">

  @stack('styles')
</head>
<body data-theme="dark">
  @yield('content')

  <!-- Core JavaScript Controller -->
  <script src="{{ asset('js/app.js') }}"></script>

  @stack('scripts')
</body>
</html>
