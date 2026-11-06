# Releasing the specification

The site at [spec.oval.vote](https://spec.oval.vote) has a working draft, rendered from `main` on
every push, and one frozen edition per release. An edition is rendered once, on your machine, and
committed under `published/`, so it never changes after release, whatever later happens to the
renderer or the source.

The specification, the reference implementation, and the editor extension share one version number.
The first two components are the language version that documents declare with `oval MAJOR.MINOR`; a
patch release is for editorial changes that leave the language alone.

## Steps

1. Start a branch from `main` and set the version in `package.json` with
   `npm version <version> --no-git-tag-version`.
2. Run `npm run release`. It checks that the specification files are committed and that
   `grammar.txt` is current, rewrites the `_Working Draft_` line under the title of `SPEC.md` to
   `_Version <version>, released <date>_`, and renders `published/v<version>/` from it with the
   specification, the schema, the examples, and the grammar, plus an `edition.json` recording the
   date. It refuses to overwrite an existing edition.
3. Commit everything as `Release <version>`, open a pull request, and merge it. The tagged commit
   therefore names its own edition, and the edition's "edit on GitHub" links point at the tag.
4. Tag the merge commit and create the GitHub release, whose page the versions index links to as the
   release notes:

   ```sh
   git checkout main && git pull
   gh release create v<version> --target main --title v<version> --generate-notes
   ```

5. Resume the draft: on a new branch run `npm run draft`, which puts `_Working Draft_` back under
   the title, then commit it as `Resume the working draft` and merge. Until this merges, the draft
   on the site shows the edition line; `npm run release` refuses to run while it is missing.

The merge in step 3 deploys the site. The new edition is at `spec.oval.vote/v<version>/`, and the
language version alias `spec.oval.vote/<MAJOR.MINOR>/` moves to it, so links to the alias always
reach the newest edition of that language version.

Release the other repositories with the same version number: `oval` by tagging `v<version>` on its
`main`, and `vscode-oval` the same way, as their READMEs describe.
