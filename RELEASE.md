# Releasing the specification

The site at [spec.oval.vote](https://spec.oval.vote) has a working draft, rendered from `main` on
every push, and one frozen edition per release. An edition is rendered once, on your machine, and
committed under `published/`, so it never changes after release, whatever later happens to the
renderer or the source.

The specification, the reference implementation, and the editor extension share one version
number. The first two components are the language version that documents declare with
`oval MAJOR.MINOR`; a patch release is for editorial changes that leave the language alone.

## Steps

1. Start a branch from `main`. Set the version in two places: `package.json`, with
   `npm version <version> --no-git-tag-version`, and the opening line of `SPEC.md`, which reads
   `**Version <version>, a working draft.**`.
2. Run `npm run release`. It checks that the two versions agree, that the specification files are
   committed, and that `grammar.txt` is current, then renders `published/v<version>/` with the
   specification, the schema, the examples, and the grammar, plus an `edition.json` recording the
   date. It refuses to overwrite an existing edition.
3. Commit everything as `Release <version>`, open a pull request, and merge it.
4. Tag the merge commit and create the GitHub release, whose page the versions index links to as
   the release notes:

   ```sh
   git checkout main && git pull
   gh release create v<version> --target main --title v<version> --generate-notes
   ```

The merge deploys the site. The new edition is at `spec.oval.vote/v<version>/`, and the language
version alias `spec.oval.vote/<MAJOR.MINOR>/` moves to it, so links to the alias always reach the
newest edition of that language version. The edition's "edit on GitHub" links point at the tag,
which is why the tag name is fixed before rendering.

Release the other repositories with the same version number: `oval` by tagging `v<version>` on its
`main`, and `vscode-oval` the same way, as their READMEs describe.
