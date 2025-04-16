export default function WelcomePage() {
  return (
    <div className="max-w-3xl mx-auto text-center mt-8 mb-12">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
        Welcome to Social Story Generator
      </h1>
      <p className="mt-6 text-lg leading-8 text-gray-600">
        Generate stories from social media exports.
      </p>

      {/* Project Description */}
      <div className="mt-12 text-left p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">The Project.</h2>
        <p className="text-gray-700 leading-relaxed">
          Social Story Generator transforms your exported social media conversation data (Instagram chats) into a dynamic and engaging story.

          Using AI, it will analyze your messages, filter for significance, and then creates a visually appealing presentation with accompanying music and colors that reflect the conversation's emotional journey.

          Watch your memories unfold as messages appear dynamically in an infinite-scroll style experience.
        </p>
      </div>

      {/* How to Get Your Data */}
      <div className="mt-8 text-left p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Get Your Instagram Data.</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 leading-relaxed">
          <li>
            <strong>Request Your Data:</strong> Go to Instagram Settings → Your activity → Download your information
          </li>
          <li>
            <strong>Select Data Type:</strong> Choose "Messages" from the available options
          </li>
          <li>
            <strong>Choose Format:</strong> Select "JSON" as your preferred format
          </li>
          <li>
            <strong>Download:</strong> Instagram will prepare your data and send you a download link via email
          </li>
          <li>
            <strong>Extract:</strong> Once downloaded, extract the ZIP file to access your JSON data
          </li>
        </ol>
      </div>

      {/* How to Use */}
      <div className="mt-8 text-left p-6 bg-white rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Use.</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700 leading-relaxed">
          <li>
            <strong>Sign Up or Log In:</strong> Create an account or log in to your existing account to get started. (Top right)
          </li>
          <li>
            <strong>Upload Data:</strong> Navigate to the 'Upload' page. Upload your social media export file (currently supports JSON format).
          </li>
          <li>
            <strong>Generate Story:</strong> Click the generate button.
          </li>
          <li>
            <strong>View Your Story:</strong> Navigate to the 'View Uploads' page. Choose the conversation, and generate your story.
          </li>
        </ol>
      </div>
    </div>
  );
} 