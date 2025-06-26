import React from 'react';

const WhatsAppButton = () => {
  const phoneNumber = '51949179423';
  // Mensaje predeterminado codificado para URL
  const defaultMessage = encodeURIComponent('Hola, quisiera pedir informes sobre los talleres de TheaterBoard.');
  const whatsappLink = `https://wa.me/${phoneNumber}?text=${defaultMessage}`;

  const styles = {
    position: 'fixed',
    bottom: '30px', // Un poco más arriba
    right: '30px',  // Un poco más separado
    backgroundColor: '#25D366',
    color: 'white',
    padding: '12px 18px', // Un poco más de padding
    borderRadius: '60px', // Más redondeado
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', // Sombra más pronunciada
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', // Centrar contenido
    textDecoration: 'none',
    zIndex: 1000,
    fontSize: '1rem', // Tamaño de fuente base
    fontWeight: '600', // Un poco más de peso en la fuente
    transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out', // Transición suave
    cursor: 'pointer',
  };

  // Estilo para hover (se aplicaría con CSS o JS, aquí solo un ejemplo conceptual)
  // En React, se manejaría con estados onMouseEnter/onMouseLeave o clases CSS
  // const hoverStyles = {
  //   transform: 'scale(1.05)',
  //   boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
  // };

  const logoStyles = {
    width: '28px', // Ajustar según el tamaño del logo
    height: '28px', // Ajustar según el tamaño del logo
    marginRight: '10px' // Más espacio entre logo y texto
  };

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      style={styles}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.35)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
      }}
    >
      <svg viewBox="0 0 32 32" style={logoStyles} fill="white" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 2.00098C8.26801 2.00098 2 8.26902 2 16.001C2 18.941 2.92906 21.7111 4.57203 23.9011L2.92906 29.001L8.19103 27.4411C10.2611 28.8911 12.981 29.7311 16 29.7311C23.732 29.7311 30 23.463 30 15.7311C30 7.99902 23.732 2.00098 16 2.00098ZM22.914 19.515C22.6421 20.2711 21.4921 20.9111 20.8001 21.0831C20.2011 21.2311 19.4781 21.2811 18.8141 21.0351C18.1501 20.7891 16.9001 20.2511 15.3541 18.8241C13.4401 17.0241 12.2041 14.8641 11.8941 14.2481C11.5841 13.6321 10.8681 12.5141 10.8681 11.6741C10.8681 10.8341 11.3481 10.3881 11.5861 10.1501C11.8251 9.91205 12.1581 9.82405 12.4101 9.82405C12.5241 9.82405 12.6281 9.82405 12.7241 9.83005C13.0541 9.86005 13.2681 9.88605 13.4861 10.3301C13.7051 10.7741 14.2541 12.1121 14.3241 12.2481C14.3951 12.3841 14.4641 12.5861 14.3241 12.8261C14.1841 13.0661 14.0621 13.1641 13.8321 13.4141C13.6021 13.6641 13.4041 13.8241 13.2101 14.0421C13.0161 14.2601 12.8341 14.4501 13.0261 14.7801C13.2181 15.1101 13.9001 16.0681 14.7861 16.8801C15.9001 17.9021 16.8021 18.2421 17.1681 18.4061C17.5341 18.5701 17.7521 18.5401 17.9421 18.3021C18.2441 17.9321 18.5801 17.4621 18.9301 17.0121C19.1781 16.6841 19.4841 16.6221 19.7721 16.7181C20.0601 16.8141 21.1841 17.3381 21.4841 17.4881C21.7841 17.6381 21.9701 17.7281 22.0421 17.8481C22.1141 17.9681 22.1141 18.5781 21.9141 19.515H22.914Z"/>
      </svg>
      Contáctanos
    </a>
  );
};

export default WhatsAppButton;
