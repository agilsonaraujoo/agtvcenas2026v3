import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-400 py-8 px-4 text-center">
      <div className="container mx-auto">
        <p className="text-lg">&copy; {new Date().getFullYear()} AGTV – Todos os direitos reservados.</p>
        <p className="text-sm mt-2">
          Desenvolvido com <span role="img" aria-label="coração">❤️</span> para sua diversão.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
