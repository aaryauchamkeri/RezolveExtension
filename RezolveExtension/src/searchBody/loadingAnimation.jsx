export default function LoadingAnimation() {
    return (
        <div className="flex flex-row justify-center items-center space-x-2 h-full w-full">
            <span className="mr-2 text-gray-600 text-2xl">Searching Documents</span>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "100ms" }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "200ms" }} />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
    );
}