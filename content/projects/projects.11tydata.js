module.exports = {
	tags: ["projects"],
	layout: "layouts/project.njk",
	permalink: "/projects/{{ page.fileSlug }}/",
	eleventyComputed: {
		description: data => data.byline || data.description
	}
};
