# Solana Escrow Program - Build Guide

This guide explains how to build the Solana escrow program using the provided Docker environment.

## Prerequisites

- Docker installed on your system
- Access to the `solanafoundation/anchor:v0.31.1` Docker image

## Build Method

### Docker Build (Recommended)

Use the provided Docker image for consistent builds:

```bash
docker run --rm -v "$(pwd)":/workspace -w /workspace solanafoundation/anchor:v0.31.1 ./cursor/build-docker.sh
```

**Benefits:**
- Consistent environment across different systems
- No need to install Anchor CLI locally
- Uses the exact same version (0.31.1) as the test environment
- Isolated build environment
- Guaranteed compatibility with test scripts

## Build Process

The build process will:

1. **Compile the Rust program** - Convert the Anchor program to Solana bytecode
2. **Generate IDL** - Create the Interface Definition Language file
3. **Create TypeScript types** - Generate TypeScript bindings for the program
4. **Output artifacts** - Place build artifacts in `target/` directory

## Build Artifacts

After a successful build, you'll find:

```
target/
├── deploy/
│   └── anchor_escrow.so          # Compiled program bytecode
├── idl/
│   └── anchor_escrow.json        # Program interface definition
└── types/
    └── anchor_escrow.ts          # TypeScript type definitions
```

## Troubleshooting

### Common Issues

1. **Version Mismatch**
   - Ensure all Anchor versions are 0.31.1
   - Check `Anchor.toml`, `package.json`, and `Cargo.toml`

2. **Docker Permission Issues**
   - Ensure Docker has access to your workspace directory
   - Check file permissions on the project directory

3. **Build Failures**
   - Check the error output for specific compilation errors
   - Ensure all dependencies are properly specified

### Build Verification

To verify the build was successful:

```bash
# Check if artifacts exist
ls -la target/deploy/
ls -la target/idl/
ls -la target/types/

# Verify program size (should be reasonable for an escrow program)
ls -lh target/deploy/anchor_escrow.so
```

## Next Steps

After building successfully:

1. **Deploy to devnet** - Use `anchor deploy` or Solana CLI
2. **Run tests** - Execute the test suite with `./cursor/test-escrow.sh`
3. **Verify on-chain** - Check the program on Solana Explorer

## Program Details

- **Program ID**: Defined in `Anchor.toml`
- **Network**: Devnet (configurable)
- **Framework**: Anchor v0.31.1
- **Language**: Rust

## Support

For build issues:
1. Check the Docker logs for detailed error messages
2. Verify all file paths and permissions
3. Ensure the Docker image is accessible
4. Review the Anchor documentation for version-specific issues
