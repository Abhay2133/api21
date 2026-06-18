package actions

import (
	"encoding/json"
	"html/template"

	"github.com/abhay2133/api21/public"
	"github.com/abhay2133/api21/templates"
	"github.com/gobuffalo/envy"

	"github.com/gobuffalo/buffalo/render"
)

var r *render.Engine

type ViteManifest map[string]struct {
	File   string   `json:"file"`
	Src    string   `json:"src"`
	CSS    []string `json:"css"`
	Assets []string `json:"assets"`
}

var viteManifest ViteManifest

func init() {
	loadViteManifest()

	r = render.New(render.Options{
		// HTML layout to be used for all HTML requests:
		HTMLLayout: "application.plush.html",

		// fs.FS containing templates
		TemplatesFS: templates.FS(),

		// fs.FS containing assets
		AssetsFS: public.FS(),

		// Add template helpers here:
		Helpers: render.Helpers{
			"viteAsset": viteAssetHelper,
		},
	})
}

func loadViteManifest() {
	if envy.Get("GO_ENV", "development") == "production" {
		fs := public.FS()
		f, err := fs.Open("dist/.vite/manifest.json")
		if err != nil {
			f, err = fs.Open("dist/manifest.json")
		}
		if err == nil {
			defer f.Close()
			dec := json.NewDecoder(f)
			_ = dec.Decode(&viteManifest)
		}
	}
}

func viteAssetHelper(entry string) template.HTML {
	if envy.Get("GO_ENV", "development") == "development" {
		devServer := envy.Get("VITE_DEV_SERVER", "http://localhost:5173")
		return template.HTML(
			`<script type="module" src="` + devServer + `/@vite/client"></script>` + "\n" +
				`<script type="module" src="` + devServer + `/` + entry + `"></script>`,
		)
	}

	// Production
	if manifestEntry, ok := viteManifest[entry]; ok {
		tags := `<script type="module" src="/dist/` + manifestEntry.File + `"></script>`
		for _, cssFile := range manifestEntry.CSS {
			tags += "\n" + `<link rel="stylesheet" href="/dist/` + cssFile + `">`
		}
		return template.HTML(tags)
	}

	// Fallback
	return template.HTML(`<script type="module" src="/dist/` + entry + `"></script>`)
}
