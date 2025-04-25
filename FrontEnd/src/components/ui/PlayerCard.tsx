import React from "react";

interface PlayerCardProps {
  name: string;
  shirt_number: number;
  position: string;
  nationality: string;
  image_url?: string;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  shirt_number,
  position,
  nationality,
  image_url,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 w-full max-w-[220px] mx-auto flex flex-col items-center text-center space-y-2">
      {image_url && (
        <img
          src={image_url}
          alt={name}
          className="w-36 h-36 object-cover rounded-xl mx-auto mt-1 mb-2 shadow"
        />
      )}
      <h2 className="text-lg font-semibold">{name}</h2>
      <p className="text-sm text-gray-600">
        #{shirt_number} | {position}
      </p>
      <p className="text-sm text-gray-500">{nationality}</p>
    </div>
  );
};

export default PlayerCard;
