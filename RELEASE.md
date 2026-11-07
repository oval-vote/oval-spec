# Releasing the specification

The site at [spec.oval.vote](https://spec.oval.vote) has a working draft, rendered from `main` on
every push, and one frozen edition per release. An edition is rendered once, by the release
workflow, and committed under `published/`, so it never changes after release, whatever later
happens to the renderer or the source.

The specification is versioned with semver, independently of the reference implementation and the
editor extension. The language itself has only a major version, which documents declare with
`oval 1`; a specification release within a major version adds to the language or changes the text,
never removes or alters a construct.

## Releasing

Open the Release workflow under Actions, choose `main`, and enter the version to release and,
optionally, one sentence for the top of the release notes. The workflow:

1. Refuses unless the version is `MAJOR.MINOR.PATCH` and greater than the current one, the tag does
   not exist, and every check on the latest commit of `main` is green.
2. Runs the repository's checks on that commit, sets the version in `package.json`, and renders
   `published/v<version>/` from the specification with the edition line in place of the draft line,
   plus an `edition.json` recording the version, the date, and a digest of the source files. Then it
   builds the site and runs the checks again.
3. Commits the result to `main` as `Release <version>`, pushes, and creates the GitHub release,
   tagged `v<version>` at that commit, with notes generated from the pull requests merged since the
   previous release and your sentence above them.

`SPEC.md` on `main` keeps its `_Working Draft_` line throughout; only the rendered edition carries
the version and date. The push deploys the site: the new edition is at `spec.oval.vote/v<version>/`,
the language alias `spec.oval.vote/<MAJOR.MINOR>/` moves to it, and the versions index omits the
working draft while the source files on `main` are identical to the latest edition.

The workflow runs as the organization's release app, whose ID and private key are the
`OVAL_SPEC_RELEASE_APP_ID` and `OVAL_SPEC_RELEASE_APP_PRIVATE_KEY` organization secrets. Commits
made with its token trigger the CI and deploy workflows, which commits made with the default
`GITHUB_TOKEN` would not.

## Withdrawing a release

Open the Unrelease workflow, choose `main`, and enter the version. Only the latest release can be
withdrawn, so the history stays linear. The workflow reverts the release commit, which removes the
edition from `published/` and restores the previous version, pushes that as `Unrelease <version>`,
and deletes the GitHub release and its tag. The next deploy drops the edition from the site. A
withdrawn version number can be released again.

## Locally

`npm run release` renders an edition into `published/` from the version in `package.json`, which is
what the workflow runs. It refuses when the specification files have uncommitted changes or the
edition already exists. Use it to preview an edition; do not commit the result by hand.
