---
layout: post
title:  "Setting up QEMU emulation of CXL"
categories: jekyll update
---
# Introduction

As someone who has never done kernel development before, I found the process of setting up an efficient workflow to be tricky. In particular, while the most straightforward approach might be to directly install the Linux kernel onto the bare metal, this leads to slow boot-up times, along with a significant probability of one's system crashing when a modification to the kernel code goes awry. Instead, it is much more effective to use a virtual machine (VM)—this both shortens boot time to a couple of seconds and protects your system from buggy changes to one’s code. This post will detail how to install and use QEMU, a hardware emulator, to emulate CXL hardware starting from Ubuntu on the bare metal (or on a VM).

This post is written for developers without prior kernel development experience, and so virtually no prerequisite knowledge is required.


# Installing Requirements

Before we begin, we first need to install the following dependencies.

 ```
 sudo apt install libglib2.0-dev libgcrypt20-dev zlib1g-dev \
 autoconf automake libtool bison flex libpixman-1-dev bc qemu-kvm \
 make ninja-build libncurses-dev libelf-dev libssl-dev debootstrap \
 libcap-ng-dev libattr1-dev
 ```

Now, we will proceed to configure, build, and install QEMU from source.

# QEMU Setup

QEMU is a package that can create a virtual machine and emulate various types of hardware—and in particular, has the ability to emulate CXL hardware.

The first step is to clone the QEMU repository. Older versions of QEMU lack CXL support, so it is safest to use the latest version as possible.

```
git clone https://github.com/qemu/qemu.git
cd qemu
./configure --target-list=x86_64-softmmu --enable-debug
make -j 4
cd ..
```

Once this step finishes (which can take some time), we proceed to the next stage.

# Building the Kernel

The first goal of this section is to be able to create an image of the Linux kernel that can be booted up via QEMU. We follow the steps listed in [here]:

```
git clone https://github.com/torvalds/linux.git
cd linux
make x86_64_defconfig
make kvm_guest.config
```

We also need to set up the .config file to enable CXL support. We must set the following options to “y” after running `make menuconfig`, as detailed in the [documentation]:

 - CONFIG_CXL_BUS
 - CONFIG_CXL_PCI
 - CONFIG_CXL_ACPI
 - CONFIG_CXL_PMEM
 - CONFIG_CXL_MEM
 - CONFIG_CXL_PORT

After setting the configs, we `make -j 4`.

Notably, the make command must be run every time we modify the code within the linux kernel, as we will use the bzImage produced to boot.

To later have /lib/modules be populated correctly, we also `sudo make modules_install`.

# Adding rootfs

In order to boot up the kernel, we need to first create a file system for later and mount it, before installing the distribution.

```
IMG=qemu-image.img
DIR=mount-point.dir
qemu-img create $IMG 16g
mkfs.ext4 $IMG
mkdir $DIR
sudo mount -o loop $IMG $DIR
sudo debootstrap --arch amd64 jammy $DIR
```

We also need to set up the QEMU image so that we will later be able to login to the kernel when it prompts us for a username and password. To set the password up, we use `sudo chroot $DIR` and `passwd`.


Finally, we now convert our qemu-image.img file into a .qcow2 file, and clean up, as described in [here]:

```
qemu-img convert -O qcow2 qemu-image.img qemu-image.qcow2
sudo umount $DIR
rmdir $DIR
```


# Booting up the Kernel

We need to make sure `/dev/kvm` has the proper permissions: `sudo chmod 666 /dev/kvm`.

We now can boot up the kernel!

Use the following script, using the QEMU that we built in qemu/build (where we replace "insert-directory-name" with our home directory name):
```
QEMU=${1}
KERNEL_PATH=${2}
QEMU_IMG=${3}

KERNEL_CMD="root=/dev/sda rw console=tty0 console=ttyS0,115200 ignore_loglevel"

${QEMU} \
    -kernel ${KERNEL_PATH} \
    -append "${KERNEL_CMD}" \
    -smp 16 \
    -enable-kvm \
    -netdev "user,id=network0,hostfwd=tcp::2023-:22" \
    -drive file=${QEMU_IMG},index=0,media=disk,format=qcow2 \
    -device "e1000,netdev=network0" \
    -machine q35,cxl=on -m 16G\
    -serial stdio \
    -display none \
    -cpu host \
    -virtfs local,path=/lib/modules,mount_tag=modshare,security_model=mapped \
```

CXL options can be appended to the end of this command as well. For example, one sample script is:

```
QEMU=${1}
KERNEL_PATH=${2}
QEMU_IMG=${3}

KERNEL_CMD="root=/dev/sda rw console=tty0 console=ttyS0,115200 ignore_loglevel"

${QEMU} \
    -kernel ${KERNEL_PATH} \
    -append "${KERNEL_CMD}" \
    -smp 16 \
    -enable-kvm \
    -netdev "user,id=network0,hostfwd=tcp::2023-:22" \
    -drive file=${QEMU_IMG},index=0,media=disk,format=qcow2 \
    -device "e1000,netdev=network0" \
    -machine q35,cxl=on -m 48G\
    -serial stdio \
    -display none \
    -cpu host \
    -virtfs local,path=/lib/modules,mount_tag=modshare,security_model=mapped \
    -object memory-backend-file,id=cxl-mem1,share=on,mem-path=/tmp/cxltest.raw,size=256M \
    -object memory-backend-file,id=cxl-lsa1,share=on,mem-path=/tmp/lsa.raw,size=256M \
    -device pxb-cxl,bus_nr=12,bus=pcie.0,id=cxl.1 \
    -device cxl-rp,port=0,bus=cxl.1,id=root_port13,chassis=0,slot=2 \
    -device cxl-type3,bus=root_port13,memdev=cxl-mem1,lsa=cxl-lsa1,id=cxl-pmem0 \
    -M cxl-fmw.0.targets.0=cxl.1,cxl-fmw.0.size=4G
```

More examples of CXL setups can be found in the [documentation].

An example invocation is the following:

```
./run_qemu_cxl.sh qemu/build/qemu-system-x86_64 linux/arch/x86/boot/bzImage qemu-image.qcow2
```

Now, we set up /lib/modules in the guest. First `mkdir /lib/modules` in the guest, followed by
```
mount -t 9p -o trans=virtio modshare /lib/modules/ -oversion=9p2000.L,posixacl,msize=104857600,cache=loose
```

Unfortunately, the VM likely doesn’t have network access. After putting in root as your username and the password selected earlier, we need to modify the settings in the kernel to allow for network access.

To fix this, navigate to /etc/netplan in the VM. Create a new file called config.yaml and insert the following:

```
network:
    version: 2
    renderer: networkd
    ethernets:
        enp0s2:
            dhcp4: true
```

(where "enp0s2" should be replaced by the name of the appropriate network interface,  
given by `ip -c a`.)

Then, run

```
sudo netplan apply
```

and the VM should be able to connect to the network, as desired.

<br>
**Thanks to Adam Manzanares, Davidlohr Bueso, Vincent Fu, and Luis Chamberlain for their guidance.**


[here]: https://www.collabora.com/news-and-blog/blog/2017/01/16/setting-up-qemu-kvm-for-kernel-development/
[documentation]: https://www.qemu.org/docs/master/system/devices/cxl.html