interface Props {
  count: number;
}

export function ParticipantCount({ count }: Props) {
  const label = count === 1 ? '1 artist' : `${count} artists`;
  return (
    <div className="fixed bottom-4 left-4 z-30">
      <span className="text-white text-[11px]" style={{ opacity: 0.4 }}>
        {label}
      </span>
    </div>
  );
}
