import React, { useState } from 'react';

function splitString(string) {
  const matches = string.match(/([a-zA-Z]+)(\d+)/);
  if (!matches) return [];
  const [, alphabeticPart, numericPart] = matches;
  return [alphabeticPart, numericPart];
}

function App() {
  const [image, setImage] = useState(null);
  const [processedImage, setProcessedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [objectCounts, setObjectCounts] = useState([]);

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
    setProcessedImage(null);
  };

  const handleDetect = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append('image', image);

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/detect', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const counts = JSON.parse(response.headers.get('x-count'));
        console.log("====")
        console.log(counts)
        const sortedCounts = Object.entries(counts)
          .filter(([label, count]) => count > 0)
          .sort((a, b) => b[1] - a[1]);
        console.log(sortedCounts)
        setObjectCounts(sortedCounts);
        setProcessedImage(URL.createObjectURL(await response.blob()));
      } else {
        console.error('Failed to process image:', response.statusText);
      }
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
      <div className="max-w-4xl p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          Object Detection
        </h1>
        <div className="mb-6 flex justify-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="mr-4 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          />
          <button
            onClick={handleDetect}
            disabled={!image || isLoading}
            className={`px-4 py-2 rounded-md font-semibold ${!image || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-300'
              }`}
          >
            {isLoading ? 'Detecting...' : 'Detect Objects'}
          </button>
        </div>
        {isLoading && (
          <p className="text-center text-gray-500 mb-6">
            Waiting for response...
          </p>
        )}
        <div className="flex justify-between">
          <div className="w-1/2 mr-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Original Image
            </h2>
            {image && (
              <img
                src={URL.createObjectURL(image)}
                alt="Original"
                className="w-full rounded-md"
              />
            )}
          </div>
          <div className="w-1/2 ml-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Processed Image
            </h2>
            {processedImage && (
              <>
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full rounded-md"
                />
              </>
            )}
          </div>
        </div>
        <div className="mt-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Object
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          Count
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {objectCounts.map((item) => (
                      <tr key={item[0]}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item[0]}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{item[1]}</div>
                        </td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
      </div>
    </div>
  );
}

export default App;