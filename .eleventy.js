module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("src/images"); // If you have images in a folder called "images"
    eleventyConfig.setTemplateFormats(["md", "css"]); // Add any additional formats your project uses
    return {
      passthroughFileCopy: true,
      markdownTemplateEngine: "njk",
      dir: {
        input: "src",
        output: "_site"
      }
    };
  };