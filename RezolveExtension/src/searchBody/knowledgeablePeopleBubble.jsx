export default function KnowledgeablePeople({ people }) {
    return (
        <div className="grid grid-cols-3 gap-4 w-full bg-white p-4 rounded-lg shadow-lg mt-6">
            {people.map((person) => (
                <div className="bg-white p-4 rounded-lg shadow-md flex flex-col items-center shadow-md border border-slate-300">
                    <span>{person.name}</span>
                    <span>{person.phone_number}</span>
                </div>
            ))}
        </div>
    )
}