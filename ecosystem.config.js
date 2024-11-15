module.exports = {
    apps: [
      {
        name: "video-stream.venux-channel.com",
        exec_mode: "cluster",
        // instances: "max", // Or a number of instances
        script: "./index.js",
      }
    ]
  };
  
  
  
  
  
  