import React from 'react';

const BackgroundImage: React.FC = () => {
  const imageUrl = 'https://www.eu-focus.europeanurology.com/cms/10.1016/j.euf.2015.06.003/asset/c0a002b8-7205-4248-b3bd-342bfb5a4161/main.assets/gr1.jpg';
  const imageAlt = 'Ultrasound Image';


  return (
    <img
      src={imageUrl}
      alt={imageAlt}
    />

  );
};

export default BackgroundImage;
