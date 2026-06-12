// Service worker mínimo — habilita a instalação do app (PWA).
// Não faz cache para evitar conteúdo desatualizado; só existe para
// satisfazer os critérios de instalação do navegador.
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){ self.clients.claim(); });
self.addEventListener('fetch', function(e){ /* sem interceptação: a rede segue normal */ });
