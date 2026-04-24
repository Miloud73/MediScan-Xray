import React, { useEffect, useState } from "react";
import Image from "next/image";

interface SliderProps {
  id: string;
  images: string[];
  direction: "left" | "right";
}

const Slider: React.FC<SliderProps> = ({ id, images, direction }) => {
  const [slides, setSlides] = useState<string[]>([]);

  useEffect(() => {
    setSlides([...images, ...images]);
  }, [images]);
  return (
    <div className="overflow-hidden w-full rounded-lg mb-6">
      <div
        className={`${
          direction === "right" ? "scrollRight" : "scrollLeft"
        } flex`}
      >
        {slides.map((src, index) => (
          <div key={index} className="flex-shrink-0">
            <Image
              src={`/${src}`}
              alt={`Slide ${index + 1}`}
              width={300}
              height={200}
              className="rounded-lg"
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Slider;
